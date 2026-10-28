package contracts

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

func TestSchemaPatternsCompileInGoAndDoNotDependOnJavaScriptEscapes(t *testing.T) {
	files, e := filepath.Glob("../schemas/*.schema.json")
	if e != nil || len(files) == 0 {
		t.Fatal("schema inventory missing", e)
	}
	for _, file := range files {
		raw, e := os.ReadFile(file)
		if e != nil {
			t.Fatal(e)
		}
		var value any
		if e = json.Unmarshal(raw, &value); e != nil {
			t.Fatal(e)
		}
		todo := []any{value}
		for len(todo) > 0 {
			v := todo[len(todo)-1]
			todo = todo[:len(todo)-1]
			switch v := v.(type) {
			case map[string]any:
				for key, item := range v {
					if key == "pattern" {
						s, ok := item.(string)
						if !ok {
							t.Fatal(file, "invalid pattern type")
						}
						if _, e = regexp.Compile(s); e != nil {
							t.Fatal(file, s, e)
						}
					}
					todo = append(todo, item)
				}
			case []any:
				todo = append(todo, v...)
			}
		}
	}
}
