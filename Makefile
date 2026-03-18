UUID := Resource_Monitor@Ory0n
SCHEMA_DIR := $(UUID)/schemas
BUILD_DIR := build
STAGING_DIR := $(BUILD_DIR)/package/$(UUID)
LOCALE_BUILD_DIR := $(BUILD_DIR)/locale
PACKAGE_PATH := $(BUILD_DIR)/$(UUID).zip
LOCAL_EXTENSIONS_DIR := $(HOME)/.local/share/gnome-shell/extensions
DOMAIN := $(UUID)
PO_DIR := po
LINGUAS_FILE := $(PO_DIR)/LINGUAS
POT_FILE := $(PO_DIR)/$(DOMAIN).pot
LANGS := $(shell [ -f $(LINGUAS_FILE) ] && sed -e 's/#.*//' -e '/^[[:space:]]*$$/d' $(LINGUAS_FILE))
PO_FILES := $(foreach lang,$(LANGS),$(PO_DIR)/$(lang).po)
MO_FILES := $(foreach lang,$(LANGS),$(LOCALE_BUILD_DIR)/$(lang)/LC_MESSAGES/$(DOMAIN).mo)

.PHONY: schema clean package install validate test pot po-update check-po translations

schema:
	glib-compile-schemas $(SCHEMA_DIR)

clean:
	rm -rf $(BUILD_DIR)
	rm -f $(SCHEMA_DIR)/gschemas.compiled

pot:
	./tools/update-pot.sh $(POT_FILE)

po-update: pot
	@for po in $(PO_FILES); do \
		msgmerge --update --backup=none "$$po" "$(POT_FILE)"; \
	done

check-po:
	@for po in $(PO_FILES); do \
		msgfmt --check --check-format --output-file=/dev/null "$$po"; \
		msgcmp --use-untranslated "$$po" "$(POT_FILE)"; \
	done

$(LOCALE_BUILD_DIR)/%/LC_MESSAGES/$(DOMAIN).mo: $(PO_DIR)/%.po
	mkdir -p $(dir $@)
	msgfmt --check --check-format --output-file="$@" "$<"

translations: $(MO_FILES)

package: clean schema translations
	mkdir -p "$(STAGING_DIR)"
	cp -r "$(UUID)"/* "$(STAGING_DIR)/"
	@if [ -d "$(LOCALE_BUILD_DIR)" ]; then \
		mkdir -p "$(STAGING_DIR)/locale"; \
		cp -r "$(LOCALE_BUILD_DIR)"/* "$(STAGING_DIR)/locale/"; \
	fi
	cd "$(BUILD_DIR)/package" && zip -qr ../$(UUID).zip "$(UUID)"
	rm -f $(SCHEMA_DIR)/gschemas.compiled

install: schema translations
	mkdir -p $(LOCAL_EXTENSIONS_DIR)
	rm -rf $(LOCAL_EXTENSIONS_DIR)/$(UUID)
	cp -r $(UUID) $(LOCAL_EXTENSIONS_DIR)/$(UUID)
	@if [ -d "$(LOCALE_BUILD_DIR)" ]; then \
		mkdir -p "$(LOCAL_EXTENSIONS_DIR)/$(UUID)/locale"; \
		cp -r "$(LOCALE_BUILD_DIR)"/* "$(LOCAL_EXTENSIONS_DIR)/$(UUID)/locale/"; \
	fi

test:
	gjs -m tests/runtime-smoke.js

validate: schema test pot check-po
	git diff --check
	rm -f $(SCHEMA_DIR)/gschemas.compiled
