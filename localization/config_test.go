package localization

import "testing"

func TestCanonicalAndConfiguration(t *testing.T) {
	for raw, want := range map[string]string{"RU-ru": "ru-RU", "iw-IL": "he-IL", "zh-hant": "zh-Hant", "en-us": "en-US"} {
		got, err := Canonical(raw)
		if err != nil || got != want {
			t.Fatal(raw, got, err)
		}
	}
	for _, bad := range []string{"", "en_US", "bad tag", "und", "../ru"} {
		if _, err := Canonical(bad); err == nil {
			t.Fatal("accepted", bad)
		}
	}
	if Direction("ar-SA") != "rtl" || Direction("ru-RU") != "ltr" {
		t.Fatal("direction")
	}
	c := Config{1, Single, "ru-RU", []string{"ru-RU"}, Routing{Strategy: "NONE"}, "OMIT"}
	if _, err := Normalize(c); err != nil {
		t.Fatal(err)
	}
	c.Locales = append(c.Locales, "RU-ru")
	if _, err := Normalize(c); err == nil {
		t.Fatal("alias duplicate")
	}
	c.Mode = Multi
	c.Locales = []string{"ru-RU", "en-US", "en-GB"}
	c.Routing.Strategy = "SUBPATH"
	routes, err := Routes(c)
	if err != nil || routes[0].Prefix != "" || routes[1].Prefix != "/en-us" || routes[2].Prefix != "/en-gb" {
		t.Fatal(routes, err)
	}
}
