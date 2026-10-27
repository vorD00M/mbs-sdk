// Package localization defines site language configuration independently of Admin language.
package localization

import (
	"errors"
	"golang.org/x/text/language"
	"strings"
)

type Mode string

const (
	Single Mode = "SINGLE"
	Multi  Mode = "MULTI"
)

type Routing struct {
	Strategy            string `json:"strategy"`
	DefaultLocalePrefix bool   `json:"defaultLocalePrefix,omitempty"`
}
type Config struct {
	SchemaVersion            int      `json:"schemaVersion"`
	Mode                     Mode     `json:"mode"`
	DefaultLocale            string   `json:"defaultLocale"`
	Locales                  []string `json:"locales"`
	Routing                  Routing  `json:"routing"`
	MissingTranslationPolicy string   `json:"missingTranslationPolicy"`
}
type LocaleDescriptor struct {
	Locale    string `json:"locale"`
	Direction string `json:"direction"`
	IsDefault bool   `json:"isDefault"`
	Status    string `json:"status"`
}
type TranslationState string

const (
	Missing   TranslationState = "missing"
	Draft     TranslationState = "draft"
	Review    TranslationState = "review"
	Published TranslationState = "published"
	Stale     TranslationState = "stale"
)

type LocalizedPageRef struct {
	SiteID             string           `json:"siteId"`
	PageID             string           `json:"pageId"`
	TranslationGroupID string           `json:"translationGroupId"`
	Locale             string           `json:"locale"`
	Path               string           `json:"path"`
	State              TranslationState `json:"state"`
}
type LocaleRouteMapping struct {
	Locale string `json:"locale"`
	Prefix string `json:"prefix"`
}

func Canonical(raw string) (string, error) {
	if raw == "" || len(raw) > 63 || strings.ContainsAny(raw, "_ /\\") {
		return "", errors.New("INVALID_LOCALE")
	}
	t, err := language.Parse(raw)
	if err != nil {
		return "", errors.New("INVALID_LOCALE")
	}
	t, err = language.All.Canonicalize(t)
	if err != nil || t == language.Und {
		return "", errors.New("INVALID_LOCALE")
	}
	base, _ := t.Base()
	if base.String() == "und" {
		return "", errors.New("INVALID_LOCALE")
	}
	return t.String(), nil
}
func Direction(raw string) string {
	t, err := language.Parse(raw)
	if err != nil {
		return "ltr"
	}
	script, _ := t.Script()
	switch script.String() {
	case "Arab", "Hebr", "Syrc", "Thaa", "Nkoo", "Adlm", "Rohg":
		return "rtl"
	}
	return "ltr"
}
func Normalize(c Config) (Config, error) {
	if c.SchemaVersion != 1 || len(c.Locales) < 1 || len(c.Locales) > 32 {
		return c, errors.New("INVALID_LOCALIZATION_CONFIG")
	}
	var err error
	c.DefaultLocale, err = Canonical(c.DefaultLocale)
	if err != nil {
		return c, err
	}
	seen := map[string]bool{}
	out := make([]string, 0, len(c.Locales))
	for _, raw := range c.Locales {
		locale, err := Canonical(raw)
		if err != nil {
			return c, err
		}
		if seen[locale] {
			return c, errors.New("DUPLICATE_LOCALE")
		}
		seen[locale] = true
		out = append(out, locale)
	}
	c.Locales = out
	if !seen[c.DefaultLocale] {
		return c, errors.New("DEFAULT_LOCALE_REQUIRED")
	}
	if c.MissingTranslationPolicy != "OMIT" {
		return c, errors.New("UNSUPPORTED_TRANSLATION_POLICY")
	}
	switch c.Mode {
	case Single:
		if len(c.Locales) != 1 || c.Routing.Strategy != "NONE" || c.Routing.DefaultLocalePrefix {
			return c, errors.New("INVALID_SINGLE_LOCALIZATION")
		}
	case Multi:
		if len(c.Locales) < 2 || c.Routing.Strategy != "SUBPATH" {
			return c, errors.New("INVALID_MULTI_LOCALIZATION")
		}
	default:
		return c, errors.New("INVALID_LOCALIZATION_MODE")
	}
	return c, nil
}
func Routes(config Config) ([]LocaleRouteMapping, error) {
	c, err := Normalize(config)
	if err != nil {
		return nil, err
	}
	counts := map[string]int{}
	for _, locale := range c.Locales {
		base := strings.Split(locale, "-")[0]
		counts[base]++
	}
	out := make([]LocaleRouteMapping, 0, len(c.Locales))
	for _, locale := range c.Locales {
		prefix := ""
		if c.Mode == Multi && (locale != c.DefaultLocale || c.Routing.DefaultLocalePrefix) {
			base := strings.Split(locale, "-")[0]
			if counts[base] > 1 {
				base = strings.ToLower(locale)
			}
			prefix = "/" + base
		}
		out = append(out, LocaleRouteMapping{locale, prefix})
	}
	return out, nil
}
