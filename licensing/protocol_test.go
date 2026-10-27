package licensing

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"
)

func TestLicenseBindingTamperingAndGrace(t *testing.T) {
	pub, key, _ := ed25519.GenerateKey(rand.Reader)
	ip, _, _ := ed25519.GenerateKey(rand.Reader)
	now := time.Now().UTC().Truncate(time.Second)
	end := now.Add(time.Hour)
	p := Payload{LicenseID: NewID(), InstallationID: NewID(), InstallationPublicKey: base64.RawURLEncoding.EncodeToString(ip), Edition: "STUDIO", Features: []string{"cms"}, UnlimitedSites: true, MaxInstallations: 1, IssuedAt: now, UpdatesEntitlement: "ALL_STANDARD_FOREVER", LeaseMode: "online", LeaseExpiresAt: &end, GracePeriodSeconds: 30 * 86400, Sequence: 1}
	e, err := Issue(p, "test", key)
	if err != nil {
		t.Fatal(err)
	}
	keys := map[string]ed25519.PublicKey{"test": pub}
	if _, s := Decode(e, keys); s != "VALID" {
		t.Fatal(s)
	}
	for _, field := range []string{"edition", "installation_id", "expires_at", "resale_enabled", "unlimited_sites", "features"} {
		var m map[string]any
		_ = json.Unmarshal(e.Payload, &m)
		m[field] = "tampered"
		b, _ := json.Marshal(m)
		bad := e
		bad.Payload = b
		if _, s := Decode(bad, keys); s != "INVALID_SIGNATURE" {
			t.Fatal(field, s)
		}
	}
	if State(p, NewID(), p.InstallationPublicKey, now, now) != "WRONG_INSTALLATION" {
		t.Fatal("binding")
	}
	if State(p, p.InstallationID, p.InstallationPublicKey, end.Add(time.Hour), now) != "GRACE" {
		t.Fatal("grace")
	}
	if State(p, p.InstallationID, p.InstallationPublicKey, end.Add(31*24*time.Hour), now) != "EXPIRED" {
		t.Fatal("expiry")
	}
	if State(p, p.InstallationID, p.InstallationPublicKey, now.Add(-time.Hour), now) != "EXPIRED" {
		t.Fatal("clock rollback")
	}
	p.LeaseMode = "offline"
	p.LeaseExpiresAt = nil
	if State(p, p.InstallationID, p.InstallationPublicKey, now.AddDate(5, 0, 0), now) != "VALID" {
		t.Fatal("offline")
	}
	if !Verify(LicenseDomain, e.Payload, e.Signature, pub) || Verify(RenewDomain, e.Payload, e.Signature, pub) {
		t.Fatal("domain separation")
	}
}
func TestCanonicalAndStrict(t *testing.T) {
	b, err := Canonical(json.RawMessage(`{"z":1.0,"a":"тест","b":[true,null]}`))
	if err != nil || string(b) != `{"a":"тест","b":[true,null],"z":1}` {
		t.Fatal(string(b), err)
	}
	var x map[string]any
	if Strict([]byte(`{"a":1,"a":2}`), &x) == nil {
		t.Fatal("duplicate key accepted")
	}
}
func TestProof(t *testing.T) {
	_, k, _ := ed25519.GenerateKey(rand.Reader)
	p, err := NewProof(NewID(), "code", Token(), k, ActivateDomain)
	if err != nil || !VerifyProof(p, ActivateDomain, time.Now()) {
		t.Fatal(err)
	}
	if VerifyProof(p, RenewDomain, time.Now()) {
		t.Fatal("cross protocol")
	}
	if VerifyProof(p, ActivateDomain, time.Now().Add(time.Hour)) {
		t.Fatal("replay window")
	}
}
