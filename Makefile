UUID := Resource_Monitor@Ory0n
.DEFAULT_GOAL := package
BUILD_DIR := build
STAGING_DIR := $(BUILD_DIR)/package
PACKAGE_PATH := $(BUILD_DIR)/$(UUID).zip
POT_FILE := po/$(UUID).pot
LANGS := $(shell sed -e 's/\#.*//' -e '/^[[:space:]]*$$/d' po/LINGUAS)
JS_FILES := $(sort $(shell find $(UUID) -type f -name '*.js'))
SHEXLI ?= shexli
PYTHON ?= python3

.PHONY: clean package install validate pot po-update

clean:
	rm -rf $(BUILD_DIR)
	rm -f $(UUID)/schemas/gschemas.compiled

pot:
	xgettext --from-code=UTF-8 --language=JavaScript --keyword=_ --add-comments=Translators: \
		--package-name=Resource_Monitor \
		--msgid-bugs-address=https://github.com/0ry0n/Resource_Monitor/issues \
		--output=$(POT_FILE) $(JS_FILES)

po-update: pot
	@set -e; for lang in $(LANGS); do \
		msgmerge --update --backup=none "po/$$lang.po" "$(POT_FILE)"; \
	done

package:
	rm -rf "$(STAGING_DIR)"
	mkdir -p "$(STAGING_DIR)/schemas" "$(STAGING_DIR)/icons"
	cp $(UUID)/*.js $(UUID)/*.css $(UUID)/metadata.json LICENSE "$(STAGING_DIR)/"
	cp -r $(UUID)/panel $(UUID)/prefs $(UUID)/runtime $(UUID)/services $(UUID)/utils "$(STAGING_DIR)/"
	cp $(UUID)/schemas/*.gschema.xml "$(STAGING_DIR)/schemas/"
	cp -r $(UUID)/icons/hicolor $(UUID)/icons/COPYING-CC0.txt $(UUID)/icons/README.md "$(STAGING_DIR)/icons/"
	@set -e; for lang in $(LANGS); do \
		mkdir -p "$(STAGING_DIR)/locale/$$lang/LC_MESSAGES"; \
		msgfmt --output-file="$(STAGING_DIR)/locale/$$lang/LC_MESSAGES/$(UUID).mo" "po/$$lang.po"; \
	done
	rm -f "$(PACKAGE_PATH)"
	cd "$(STAGING_DIR)" && zip -qr "../$(UUID).zip" .

install: package
	gnome-extensions install --force "$(PACKAGE_PATH)"

validate: package
	$(SHEXLI) "$(abspath $(PACKAGE_PATH))" --format json > "$(BUILD_DIR)/shexli.json"
	@$(PYTHON) -c 'import json, sys; r = json.load(open(sys.argv[1])); print(json.dumps(r["summary"], indent=2)); [print(f["rule_id"], f["severity"], f["message"], f["evidence"]) for f in r["findings"]]; sys.exit(r["summary"]["status"] != "clean" or bool(r["findings"]))' "$(BUILD_DIR)/shexli.json"
