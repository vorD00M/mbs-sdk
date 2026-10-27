// Package licensing defines public wire formats, not entitlement issuance policy.
package licensing

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"regexp"
	"time"

	"github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer"
)

const Format = "mbs-platform-license-v1"
const LicenseDomain = "MBS-LICENSE-V1\x00"
const ActivateDomain = "MBS-ACTIVATE-V1\x00"
const RenewDomain = "MBS-RENEW-V1\x00"
const DeactivateDomain = "MBS-DEACTIVATE-V1\x00"

type Payload struct {
	LicenseID             string     `json:"license_id"`
	InstallationID        string     `json:"installation_id"`
	InstallationPublicKey string     `json:"installation_public_key"`
	Edition               string     `json:"edition"`
	Features              []string   `json:"features"`
	UnlimitedSites        bool       `json:"unlimited_sites"`
	UnlimitedAccounts     bool       `json:"unlimited_accounts"`
	WhiteLabel            bool       `json:"white_label"`
	ResaleEnabled         bool       `json:"resale_enabled"`
	MaxInstallations      int        `json:"max_installations"`
	IssuedAt              time.Time  `json:"issued_at"`
	ExpiresAt             *time.Time `json:"expires_at"`
	UpdatesEntitlement    string     `json:"updates_entitlement"`
	LeaseMode             string     `json:"lease_mode"`
	LeaseExpiresAt        *time.Time `json:"lease_expires_at"`
	GracePeriodSeconds    int        `json:"grace_period_seconds"`
	Sequence              int64      `json:"sequence"`
	Revoked               bool       `json:"revoked"`
}
type Envelope struct {
	Format    string          `json:"format"`
	KeyID     string          `json:"kid"`
	Payload   json.RawMessage `json:"payload"`
	Signature string          `json:"signature"`
}
type Proof struct {
	InstallationID string    `json:"installation_id"`
	PublicKey      string    `json:"public_key"`
	ActivationCode string    `json:"activation_code,omitempty"`
	CoreVersion    string    `json:"core_version"`
	Nonce          string    `json:"nonce"`
	IssuedAt       time.Time `json:"issued_at"`
	IdempotencyKey string    `json:"idempotency_key"`
}
type SignedProof struct {
	Request   Proof  `json:"request"`
	Signature string `json:"signature"`
}

func Canonical(v any) ([]byte, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return jsoncanonicalizer.Transform(b)
}
func Strict(b []byte, v any) error {
	if len(b) > 64<<10 {
		return errors.New("document too large")
	}
	if _, err := jsoncanonicalizer.Transform(b); err != nil {
		return err
	}
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return err
	}
	if d.Decode(new(any)) != io.EOF {
		return errors.New("trailing JSON")
	}
	return nil
}
func Signature(domain string, v any, key ed25519.PrivateKey) (string, error) {
	b, err := Canonical(v)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(ed25519.Sign(key, append([]byte(domain), b...))), nil
}
func Verify(domain string, v any, sig string, key ed25519.PublicKey) bool {
	b, err := Canonical(v)
	if err != nil || len(key) != ed25519.PublicKeySize {
		return false
	}
	s, err := base64.RawURLEncoding.DecodeString(sig)
	return err == nil && ed25519.Verify(key, append([]byte(domain), b...), s)
}
func Issue(p Payload, kid string, key ed25519.PrivateKey) (Envelope, error) {
	b, err := Canonical(p)
	if err != nil {
		return Envelope{}, err
	}
	sig, err := Signature(LicenseDomain, json.RawMessage(b), key)
	return Envelope{Format, kid, b, sig}, err
}
func Decode(e Envelope, keys map[string]ed25519.PublicKey) (Payload, string) {
	var p Payload
	if e.Format != Format {
		return p, "UNSUPPORTED_FORMAT"
	}
	if !Verify(LicenseDomain, e.Payload, e.Signature, keys[e.KeyID]) {
		return p, "INVALID_SIGNATURE"
	}
	if err := Strict(e.Payload, &p); err != nil || !ValidPayload(p) {
		return p, "UNSUPPORTED_FORMAT"
	}
	return p, "VALID"
}
func ValidPayload(p Payload) bool {
	if !UUID(p.LicenseID) || !UUID(p.InstallationID) || p.MaxInstallations != 1 || p.Sequence < 1 || p.Sequence > 9007199254740991 || p.IssuedAt.IsZero() || p.UpdatesEntitlement != "ALL_STANDARD_FOREVER" || len(p.Features) > 100 {
		return false
	}
	if _, err := PublicKey(p.InstallationPublicKey); err != nil {
		return false
	}
	if p.GracePeriodSeconds < 0 || p.GracePeriodSeconds > 90*86400 {
		return false
	}
	if p.LeaseMode != "online" && p.LeaseMode != "offline" {
		return false
	}
	if p.LeaseMode == "online" && (p.LeaseExpiresAt == nil || !p.LeaseExpiresAt.After(p.IssuedAt)) {
		return false
	}
	if p.LeaseMode == "offline" && p.LeaseExpiresAt != nil {
		return false
	}
	if p.ExpiresAt != nil && !p.ExpiresAt.After(p.IssuedAt) {
		return false
	}
	if !p.UnlimitedSites {
		return false
	}
	switch p.Edition {
	case "STUDIO":
		return !p.ResaleEnabled && !p.UnlimitedAccounts && !p.WhiteLabel
	case "OPERATOR", "CLOUD_UNLIMITED":
		return p.ResaleEnabled && p.UnlimitedAccounts && p.WhiteLabel
	}
	return false
}
func State(p Payload, id, public string, now, last time.Time) string {
	if p.InstallationID != id || p.InstallationPublicKey != public {
		return "WRONG_INSTALLATION"
	}
	if now.Before(last.Add(-5*time.Minute)) || p.IssuedAt.After(now.Add(5*time.Minute)) {
		return "EXPIRED"
	}
	if p.Revoked {
		return "REVOKED"
	}
	if p.ExpiresAt != nil && !now.Before(*p.ExpiresAt) {
		return "EXPIRED"
	}
	if p.LeaseMode == "offline" || now.Before(*p.LeaseExpiresAt) {
		return "VALID"
	}
	if now.Before(p.LeaseExpiresAt.Add(time.Duration(p.GracePeriodSeconds) * time.Second)) {
		return "GRACE"
	}
	return "EXPIRED"
}
func PublicKey(s string) (ed25519.PublicKey, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil || len(b) != 32 {
		return nil, errors.New("invalid public key")
	}
	return ed25519.PublicKey(b), nil
}
func NewProof(id, code, idem string, key ed25519.PrivateKey, domain string) (SignedProof, error) {
	p := Proof{id, base64.RawURLEncoding.EncodeToString(key.Public().(ed25519.PublicKey)), code, "0.2.0", Token(), time.Now().UTC().Truncate(time.Second), idem}
	sig, err := Signature(domain, p, key)
	return SignedProof{p, sig}, err
}
func VerifyProof(p SignedProof, domain string, now time.Time) bool {
	r := p.Request
	k, err := PublicKey(r.PublicKey)
	return err == nil && UUID(r.InstallationID) && len(r.Nonce) == 43 && len(r.IdempotencyKey) >= 16 && len(r.IdempotencyKey) <= 100 && len(r.CoreVersion) <= 50 && r.IssuedAt.After(now.Add(-5*time.Minute)) && r.IssuedAt.Before(now.Add(5*time.Minute)) && Verify(domain, r, p.Signature, k)
}
func Digest(v any) string {
	b, err := Canonical(v)
	if err != nil {
		panic(err)
	}
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}
func Token() string        { return base64.RawURLEncoding.EncodeToString(random(32)) }
func Hash(s string) []byte { v := sha256.Sum256([]byte(s)); return v[:] }
func NewID() string {
	b := random(16)
	b[6] = (b[6] & 15) | 64
	b[8] = (b[8] & 63) | 128
	h := hex.EncodeToString(b)
	return h[:8] + "-" + h[8:12] + "-" + h[12:16] + "-" + h[16:20] + "-" + h[20:]
}

var uuid = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func UUID(s string) bool { return uuid.MatchString(s) && s != "00000000-0000-0000-0000-000000000000" }
func random(n int) []byte {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return b
}
