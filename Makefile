UUID := Resource_Monitor@Ory0n
SCHEMA_DIR := $(UUID)/schemas
BUILD_DIR := build
PACKAGE_PATH := $(BUILD_DIR)/$(UUID).zip
LOCAL_EXTENSIONS_DIR := $(HOME)/.local/share/gnome-shell/extensions

.PHONY: schema clean package install validate

schema:
	glib-compile-schemas $(SCHEMA_DIR)

clean:
	rm -rf $(BUILD_DIR)
	rm -f $(SCHEMA_DIR)/gschemas.compiled

package: clean schema
	mkdir -p $(BUILD_DIR)
	cd $(UUID) && zip -qr ../$(PACKAGE_PATH) .
	rm -f $(SCHEMA_DIR)/gschemas.compiled

install: schema
	mkdir -p $(LOCAL_EXTENSIONS_DIR)
	rm -rf $(LOCAL_EXTENSIONS_DIR)/$(UUID)
	cp -r $(UUID) $(LOCAL_EXTENSIONS_DIR)/$(UUID)

validate: schema
	git diff --check
	rm -f $(SCHEMA_DIR)/gschemas.compiled
