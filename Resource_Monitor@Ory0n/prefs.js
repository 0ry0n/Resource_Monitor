/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init, buildPrefsWidget */

/*
 * Resource_Monitor is Copyright © 2018-2022 Giuseppe Silvestro
 *
 * This file is part of Resource_Monitor.
 *
 * Resource_Monitor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Resource_Monitor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Resource_Monitor. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let builder;

function init() {
    
}

/*function buildPrefsWidget() {
    builder = new Gtk.Builder();

    builder.set_scope(this);
    builder.add_from_file(Me.dir.get_path() + "/prefs.ui");

    return builder.get_object("main_prefs");
}*/

const {Gtk} = imports.gi;

/*function fillPreferencesWindow(window) {
    let builder = Gtk.Builder.new();
    builder.add_from_file(Me.dir.get_path() + '/prefs.ui');
    let page = builder.get_object('main_notebook');
    window.add(page);
}*/

function buildPrefsWidget() {
    let builder = Gtk.Builder.new();
    builder.add_from_file(Me.dir.get_path() + '/prefs.ui');
    let page = builder.get_object('main_notebook');
    
    return page;
}