﻿//#region Map Initailize
// CHANGE FROM VISUAL STUDIO - TEST CHECKING IN
// CHANGE FROM SUBLIME TEXT - TEST CHECKING IN
// TESTING SUBLIME TEXT AGAIN
dojo.require("dijit.dijit");
dojo.require("esri.map");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.PopupMobile");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.dijit.OverviewMap");
dojo.require("esri.arcgis.Portal");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.find");
dojo.require("esri.tasks.identify");

//global variables
var map;
var ago4o;
var ago4oGroup;
var locator;
//config items
var config = {};
var utilities = {};
//Accessing ArcGIS Online For Organizations (ago4o)
config.ago4oUrl = "http://philadelphia.maps.arcgis.com/sharing/rest/";
config.ago4oGroup = "ff27262386a84f8b9e6d82d861bf2854"; //production group ID
//config.ago4oGroup = "daae8c4d60494814a1ad81545cfc5786"; //staging group ID
config.geometryUrl = "http://gis.phila.gov/ArcGIS/rest/services/Geometry/GeometryServer";
config.geocodeUrl = "http://services.phila.gov/ULRS311/Data/Location2272";
config.baseMapID = 'e79a75c2d7174252a40cdaaefed15c04';  // was: 'e79a75c2d7174252a40cdaaefed15c04'; new: d0d287efec7a447eb689b46d4e1cc827
config.geocodeFieldName = "SingleLine";
config.deptFilter = "";
config.topicCategories = [];
config.layersLoaded = []; // ADDED 12/21
config.topicsLoaded = false;
config.regionsLoaded = false;
config.regionMapService = "http://gis.phila.gov/ArcGIS/rest/services/PhilaGov/ServiceAreas/MapServer";
config.searchShortcut = "";
config.shortcutLookup = {
    "cd:": { layers: [1], fields: ['DIST_NUM'], resultLabel:"Council District: "},
    "ppd:": { layers: [7], fields: ['DIST_NUM'], resultLabel: "Police District: " },
    "zip:": { layers: [20], fields: ['CODE'], resultLabel: "Zip Code: " },
    "fd:": { layers: [2], fields: ['FIRENG_ID'], resultLabel: "Fire District: " },
    "ct:": { layers: [0], fields: ['TRACT'], resultLabel: "Census Tract: " },
    "wd:": { layers: [10], fields: ['WARD_NUM'], resultLabel: "Political Ward: " },
    "hsc:": { layers: [17], fields: ['NAME'], resultLabel: "High School Catchment: " }
}
config.numberKeywordLookup = {
    'council':"cd:",
    'police':"ppd:",
    'fire':"fd:",
    'census':"ct:",
    'ward':"wd:"
}
config.shortcutSearchServiceUrl = "http://gis.phila.gov/ArcGIS/rest/services/PhilaGov/ServiceAreas/MapServer";

function mapLoad() {
    if (browserGrade() == "B") {
        $(".fullmap").height($(window).height() - 70);
    }

    $("#LegendButton").hide("slide", { direction: "right" }, 100);

    esri.config.defaults.io.corsDetection = false;
    var popup;
    if (isPhone()) {
        popup = new esri.dijit.PopupMobile(null, dojo.create("div"));
    }
    else {
        popup = new esri.dijit.Popup(null, dojo.create("div"));
    }
    map = new esri.Map("map", { logo: false, infoWindow: popup });

    registerLoading();

    //temporary bugfix, test to see if we can get rid of this at a later date 6/15/12
    esri.dijit.BasemapGallery.prototype._markSelected = function (basemap) {
        if (basemap) {
            // unselect all basemap gallery items
            dojo.forEach(dojo.query(".esriBasemapGallerySelectedNode",
        this.domNode), function (node) {
            dojo.removeClass(node, "esriBasemapGallerySelectedNode");
        });
            // select current basemap gallery item
            var basemapNode = dojo.byId("galleryNode_" + basemap.id);
            if (basemapNode) {
                dojo.addClass(basemapNode, "esriBasemapGallerySelectedNode");
            }
        }
    }
    utilities.storage = Storage('map');
    createBasemapGallery();
    pageSetup();
    //locatorSetup();

    if (isPhone()) {
        window.scrollTo(0, 1);
    }

    checkUrlParams();

    compatCheck();
}

dojo.addOnLoad(mapLoad);

//#endregion

//#region Page Setup

function registerLoading() {
    dojo.connect(map, "onUpdateStart", function () {
        $(".loadAlert").show();
    });
    dojo.connect(map, "onUpdateEnd", function () {
        $(".loadAlert").hide();
    });
}

function pageSetup() {
    $("#LegendDialog").dialog({
        autoOpen: false,
        resizable: false,
        show: { effect: 'drop', direction: "up" },
        hide: "fade",
        position: (isPhone() ? [0, 0] : [50, 82]),
        zIndex: 1050,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#LegendButton").click(function () {
        $('#LegendDialog').dialog('open');
        _gaq.push(['_trackEvent', 'Menu', 'Open', 'Legend']);
        return false;
    });

    $("#RegionsDialog").dialog({
        autoOpen: false,
        resizable: false,
        show: { effect: 'drop', direction: "up" },
        hide: "fade",
        position: (isPhone() ? [0, 0] : [50, 82]),
        zIndex: 1050,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#RegionsButton").click(function () {
        showRegionsDialog();
        _gaq.push(['_trackEvent', 'Menu', 'Open', 'Regions']);
        return false;
    });

    $("#HelpDialog").dialog({
        autoOpen: false,
        resizable: false,
        show: { effect: 'drop', direction: "up" },
        hide: "fade",
        position: (isPhone() ? [0, 0] : [50, 82]),
        zIndex: 1050,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#HelpButton").click(function () {
        $('#HelpDialog').dialog('open');
        _gaq.push(['_trackEvent', 'Menu', 'Open', 'Regions']);
        return false;
    });

    $("#TopicsDialog").dialog({
        autoOpen: false,
        resizable: false,
        show: { effect: 'drop', direction: "up" },
        hide: "fade",
        modal: true,
        width: isTabletOrLess() ? (isPhone() ? $(window).width()-7:($(window).width() * .95)) : 972,
        height: (isPhone() ? $(window).height()-7 : $(window).height() * .9)
    });

    $("#TopicsButton").click(function () {
        showBrowser();
        _gaq.push(['_trackEvent', 'Menu', 'Open', 'Map Browser']);
        return false;
    });

    $("#SearchDialog").dialog({
        autoOpen: false,
        resizable: false,
        show: { effect: 'drop', direction: "up" },
        hide: "fade",
        position: (isPhone() ? [0,0] : [50, 82]),
        zIndex: 1050,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#SearchButton").click(function () {
        $('#SearchDialog').dialog('open');
        _gaq.push(['_trackEvent', 'Menu', 'Open', 'Search']);
        return false;
    });

    $("#AddressSearchButton").click(function () {
        mapSearch($("#AddressSearchText").val());
        _gaq.push(['_trackEvent', 'Search', 'RawSearch', $("#AddressSearchText").val()]);
        return false;
    });

    $("#SearchMoreButton").click(function () {
        searchToggle();
    });

    $("#SearchMore").hide();
}

function showBrowser() {
    if (config.topicsLoaded) {
        $('#TopicsDialog').dialog('open');
    }
    else {
        initMapTopics();
    }
}

function showRegionsDialog() {
    if (config.regionsLoaded) {
        $('#RegionsDialog').dialog('open');
    }
    else {
        initMapRegions();
    }
}

function resizeElements() {
    if (browserGrade() == "B") {
        $(".fullmap").height($(window).height() - 70);
    }
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
        $(".fullmap").height($(window).height() - 70);
    }
    map.resize();

    $("#TopicsDialog").dialog({
        autoOpen: false,
        width: isTabletOrLess() ? (isPhone() ? $(window).width() - 7 : ($(window).width() * .95)) : 972,
        height: (isPhone() ? $(window).height() - 7 : $(window).height() * .9)
    });

    $("#LegendDialog").dialog({
        autoOpen: false,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#HelpDialog").dialog({
        autoOpen: false,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#SearchDialog").dialog({
        autoOpen: false,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });

    $("#RegionsDialog").dialog({
        autoOpen: false,
        width: (isPhone() ? $(window).width() - 7 : "auto"),
        height: (isPhone() ? $(window).height() - 7 : "auto")
    });
}

function checkUrlParams() {
    if (window.location.search.length > 1) {
        window.location.hash = window.location.search.substring(1, window.location.search.length); window.location.search = "";
    }
    if (decodeURIComponent(getUrlVar("dept")) > "") {
        config.deptFilter = decodeURIComponent(getUrlVar("dept"));
    }

    if (decodeURIComponent(getUrlVar("address")) > "") {
        searchAddress(decodeURIComponent(getUrlVar("address")));
        $('#SearchDialog').dialog('open');
    }

    if (decodeURIComponent(getUrlVar("id")) > "") {
        loadWebMap(decodeURIComponent(getUrlVar("id")));
    }
    if (utilities.storage.get('hideWelcome') != "true" && decodeURIComponent(getUrlVar("id")) === "") { // Edited 3/5/13 so that if hitting a specific ID it won't show the guiders
        welcomeGuiders();
    }
    else {
        if (!(decodeURIComponent(getUrlVar("id")) > "")) {
            showBrowser();
        }
    }
    $(window).bind('hashchange', function() {
        if (decodeURIComponent(getUrlVar("id")) > "") {
            loadWebMap(decodeURIComponent(getUrlVar("id")));
        }
    });
}

function pageSetupTouch() {
    //not currently needed
}
//#region Guiders
function welcomeGuiders() {
    guiders.createGuider({
        buttons: [{ name: "Take a Tour",
                    onclick: guiders.next },
                  { name: "No Thanks",
                    onclick: function () {
                        _gaq.push(['_trackEvent', 'Guiders', 'No Thanks', '0']);
                        if (getUrlVar("id").length < 1) {
                            showBrowser();
                        }
                        guiders.hideAll();
                    }
                  }],
        description: '<div style="height:200px;" class="thumbnail"><img src="/Map/Content/Images/Welcome' + Math.floor(Math.random() * 4) + '.jpg" alt="City Hall"></div>' +
        "<p>This application allows you to view maps with data from City departments. If this is your first time visiting, we recommend you take a tour of the site." +
        '<br/><br/><input class="pull-left" type="checkbox" id="ShowWelcome"/><label for="ShowWelcome">&nbsp;&nbsp;Do not show this message again.</label>',
        id: "welcome",
        classString: "span4",
        next: "tourFirst",
        onHide: checkHide,
        offset: { left: 0, top: -30 },
        overlay: true,
        width: 300,
        title: "&nbsp;&nbsp;Welcome to Phila.gov/Map"
    }).show();

    guiders.createGuider({
        attachTo: "#TopicsButton",
        buttons: [{ name: "End Tour",
                    onclick: function () {
                        _gaq.push(['_trackEvent', 'Guiders', 'End Tour', 'End Tour 0']);
                        if (getUrlVar("id").length < 1) {
                            showBrowser();
                        }
                        guiders.hideAll();
                    }
                   },
                   { name: "Next" }
                 ],
        description: "Use the <u>Map Browser</u> to view the available maps.",
        id: "tourFirst",
        next: "tourSecond",
        offset: { left: 25, top: -8 },
        position: 5,
        title: "&nbsp;&nbsp;Open a Map",
        width: 200
    });

    guiders.createGuider({
        attachTo: "#SearchButton",
        buttons: [{ name: "End Tour",
                    onclick: function() {
                        _gaq.push(['_trackEvent', 'Guiders', 'End Tour', 'End Tour 1']);
                        if (getUrlVar("id").length < 1) {
                            showBrowser();
                        }
                       guiders.hideAll();
                    }
                  },
                  { name: "Next" }
                 ],
        description: "<u>Search</u> for an address or boundaries such as zip codes and council districts.",
        id: "tourSecond",
        next: "tourThird",
        offset: { left: -10, top: -25 },
        position: 2,
        title: "&nbsp;&nbsp;Looking for something?",
        width: 175
    });

    guiders.createGuider({
        attachTo: "#RegionsButton",
        buttons: [{ name: "End Tour",
                    onclick: function() {
                        _gaq.push(['_trackEvent', 'Guiders', 'End Tour', 'End Tour 2']);
                        if (getUrlVar("id").length < 1) {
                            showBrowser();
                        }
                        guiders.hideAll();
                    }
                  },
                  { name: "Next" }
                 ],
        description: "Display <u>Regions</u> on the map such as sanitation areas or police districts.",
        id: "tourThird",
        next: "tourFourth",
        offset: { left: -20, top: -5 },
        position: 7,
        title: "&nbsp;&nbsp;Service Regions",
        width: 200
    });

    guiders.createGuider({
        attachTo: "#HelpButton",
        buttons: [{ name: "End Tour",
                    onclick: function() {
                        _gaq.push(['_trackEvent', 'Guiders', 'End Tour', 'End Tour 3']);
                        if (getUrlVar("id").length < 1) {
                            showBrowser();
                        }
                        guiders.hideAll();
                    }
                   }
                 ],
        description: "Use <u>Help</u> to find more information about what you can do with the site.",
        id: "tourFourth",
        offset: { left: 10, top: -25 },
        position: 10,
        title: "&nbsp;&nbsp;Lost or Confused?",
        width: 200,
        onHide: showBrowser
    });
}

function mapGuiders() {
    $('#HelpDialog').dialog('close');
    guiders.createGuider({
        attachTo: ".esriSimpleSliderIncrementButton",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "<u>To Zoom In:</u><br/><ul><li>Click this button <i class='icon-plus'></i></li><li>Double Click the map<i class='icon-hand-up'></i></li><li>Scrollwheel Up <i class='icon-sort'></i></li><li>Spread on a touchscreen <i class='icon-resize-full'></i></li></ul>",
        id: "mapFirst",
        next: "mapSecond",
        offset: { left: 0, top: -25 },
        position: 2,
        title: "&nbsp;&nbsp;Zoom In",
        width: 250
    }).show();

    guiders.createGuider({
        attachTo: ".esriSimpleSliderDecrementButton",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "<u>To Zoom Out:</u><br/><ul><li>Click this button <i class='icon-minus'></i></li><li>Scrollwheel Down <i class='icon-sort'></i></li><li>Pinch on a touchscreen <i class='icon-resize-small'></i></li></ul>",
        id: "mapSecond",
        next: "mapThird",
        offset: { left: 0, top: -25 },
        position: 2,
        title: "&nbsp;&nbsp;Zoom Out",
        width: 250
    });

    guiders.createGuider({
        attachTo: "#BaseMapSwitcher",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "This Map Toggle will allow you to select a different base map.",
        id: "mapThird",
        next: "mapFourth",
        offset: { left: 0, top: 0 },
        position: 9,
        title: "&nbsp;&nbsp;Select Base Maps",
        width: 250
    });

    guiders.createGuider({
        attachTo: "#Map",
        buttons: [{ name: "End Help", onclick: guiders.hideAll}],
        description: "Click and drag the map to move around.",
        id: "mapFourth",
        offset: { left: 50, top: 50 },
        position: 9,
        title: "&nbsp;&nbsp;Move the Map",
        width: 250
    });
}

function searchGuiders(){
    $('#HelpDialog').dialog('close');
    $('#SearchDialog').dialog('open');
    setTimeout(function () {
        guiders.createGuider({
            attachTo: "#AddressSearchText",
            buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
            description: "Start by typing a Philadelphia street address or use <i>1400 Arch St</i>.",
            id: "searchFirst",
            next: "searchSecond",
            position: 6,
            title: "&nbsp;&nbsp;Enter an Address",
            width: 250
        }).show();
    }, 500);

    guiders.createGuider({
        attachTo: "#AddressSearchButton",
        buttons: [{ name: "End Help", onclick: guiders.hideAll}],
        description: "Click the search button or press Enter.",
        id: "searchSecond",
        next: "searchThird",
        position: 5,
        offset: { left: 25, top: 0 },
        title: "&nbsp;&nbsp;Click to Search",
        width: 250,
        onShow: function () {
            if ($("#AddressSearchText").val().length < 1) {
                $("#AddressSearchText").val('1400 Arch St.');
            }
            $("#AddressSearchButton").on('click.guiders',function () {
                guiders.next();
            });
        },
        onHide: function () {
            $("#AddressSearchButton").off('click.guiders');
        }
    });

    guiders.createGuider({
        attachTo: "#SearchMoreButton",
        buttons: [{ name: "End Help", onclick: guiders.hideAll}],
        description: "Now that you've search for an address, let's search for a council district.  Click here to see what else you can look for.",
        id: "searchThird",
        next: "searchFourth",
        position: 7,
        offset: { left: 0, top: 0 },
        title: "&nbsp;&nbsp;Click to Expand",
        width: 250,
        onShow: function () {
            if ($("#SearchMore").is(':hidden')) {
                $("#SearchMoreButton").on('click.guiders',function () {
                    guiders.next();
                });
            }
            else {
                guiders.next();
            }
        },
        onHide: function () {
            $("#AddressSearchButton").off('click.guiders');
        }
    });

    guiders.createGuider({
        attachTo: '[rel-shortcut="cd:"]',
        buttons: [{ name: "End Help", onclick: guiders.hideAll}],
        description: "Click here to select that you want to search for council districts.",
        id: "searchFourth",
        next: "searchFifth",
        position: 6,
        offset: { left: 0, top: -5 },
        title: "&nbsp;&nbsp;Click to Select",
        width: 250,
        onShow: function () {
            $('[rel-shortcut="cd:"]').on('click.guiders',function () {
                guiders.next();
            });
        },
        onHide: function () {
            $('[rel-shortcut="cd:"]').off('click.guiders');
        }
    });

    guiders.createGuider({
        attachTo: "#AddressSearchText",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "Type in a Council District number If you don't know one, you can use any number <i>1-10</i>.",
        id: "searchFifth",
        next: "searchSixth",
        position: 6,
        title: "&nbsp;&nbsp;Enter a District",
        width: 250,
        onHide: function () {
            if ($("#AddressSearchText").val().length < 1 || $("#AddressSearchText").val().length > 2) {
                $("#AddressSearchText").val('2');
            }
        }
    });

    guiders.createGuider({
        attachTo: "#AddressSearchText",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "Type in a Council District number If you don't know one, you can use any number <i>1-10</i>.",
        id: "searchFifth",
        next: "searchSixth",
        position: 6,
        title: "&nbsp;&nbsp;Enter a District",
        width: 250
    });

    guiders.createGuider({
        attachTo: "#AddressSearchButton",
        buttons: [{ name: "End Help", onclick: guiders.hideAll}],
        description: "Click this button, or hit the Enter key on your keyboard.",
        id: "searchSixth",
        position: 5,
        offset: { left: 25, top: 0 },
        title: "&nbsp;&nbsp;Click to Search",
        width: 250,
        onShow: function () {
            if ($("#AddressSearchText").val().length < 1 || $("#AddressSearchText").val().length > 2) {
                $("#AddressSearchText").val('2');
            }
            $("#AddressSearchButton").on('click.guiders', function () {
                guiders.hideAll();
            });
        },
        onHide: function () {
            $("#AddressSearchButton").off('click.guiders');
        }
    });
}

function browserGuiders() {
    $('#HelpDialog').dialog('close');
    showBrowser();
    setTimeout(function () {
        guiders.createGuider({
            buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
            description: "The Map Browser allows you to find and view available maps. " +
            "Maps are categorized by the same topics used throughout Phila.gov. " +
            "This tour will guide you through the use of the Map Browser.",
            id: "browserFirst",
            next: "browserSecond",
            title: "&nbsp;&nbsp;Welcome to the Map Browser",
            width: 350
        }).show();
    }, 1000);

    guiders.createGuider({
        attachTo: "#MapsList",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "This list shows the available maps to view in the application.",
        id: "browserSecond",
        next: "browserThird",
        position: 9,
        title: "&nbsp;&nbsp;Map List",
        width: 250
    });

    guiders.createGuider({
        attachTo: "#TopicsList",
        buttons: [{ name: "Next" }, { name: "End Help", onclick: guiders.hideAll}],
        description: "Select a topic to filter the available maps.",
        id: "browserThird",
        next: "browserFourth",
        position: 3,
        title: "&nbsp;&nbsp;Filter by Topic",
        width: 250
    });

    guiders.createGuider({
        attachTo: "#MapsList :first.btn-primary",
        buttons: [ { name: "End Help", onclick: guiders.hideAll}],
        description: "Select View Map to view the map in the application.  Select View Details to read more about the map and view it in <a title='What is ArcGIS Online?' target='_blank' href='http://help.arcgis.com/en/arcgisonline/help/#/What_is_ArcGIS_Online/010q00000074000000/'>ArcGIS Online</a>.",
        id: "browserFourth",
        position: 9,
        title: "&nbsp;&nbsp;View Map",
        width: 250
    });
}

function regionGuiders() {
    $('#HelpDialog').dialog('close');
    showRegionsDialog();
    setTimeout(function () {
        guiders.createGuider({
            attachTo: "#RegionsDialog",
            buttons: [{ name: "End Help", onclick: guiders.hideAll}],
            description: "Clcik an item from the list to display it on the map. Click it again to turn it off.  Only one item can be selected at a time.",
            id: "regionFirst",
            next: "regionSecond",
            position:3,
            title: "&nbsp;&nbsp;Display Regions/Service Areas",
            width: 250
        }).show();
    }, 1000);
}

function checkHide() {
    if ($('#ShowWelcome').is(':checked')) {
        utilities.storage.set('hideWelcome', true);
    }
}
//#endregion
//#endregion


//#region SearchTools
function mapSearch(strSearch) {
    map.graphics.clear();
    map.infoWindow.hide();
    strSearch = checkSearch(strSearch);
    $('.searchError').remove();
    switch (config.searchShortcut.toLowerCase()) {
        case "":
            searchAddress(strSearch);
            _gaq.push(['_trackEvent', 'Search', 'AddressSearch', strSearch]);
            break;
        default:
            searchArea(strSearch, config.shortcutLookup[config.searchShortcut.toLowerCase()].layers, config.shortcutLookup[config.searchShortcut.toLowerCase()].fields);
            _gaq.push(['_trackEvent', 'Search', 'RegionSearch', config.searchShortcut.toLowerCase() + ":" + strSearch]);
            break;
    }
}

function checkSearch(strSearch) {
    if (strSearch.split(":").length > 1) {
        config.searchShortcut = strSearch.split(":")[0] + ":";
        strSearch = strSearch.split(":")[1];
        setSearch($($('[rel-shortcut="' + config.searchShortcut.toLowerCase() + '"]')[0]).children()[0], config.searchShortcut);
    }
    else {
        var searchParts = strSearch.split(" ");
        for (var i = 0; i < searchParts.length; i++) {
            if (config.numberKeywordLookup.hasOwnProperty(searchParts[i].toLowerCase())) {
                config.searchShortcut = config.numberKeywordLookup[searchParts[i].toLowerCase()];
                setSearch($($('[rel-shortcut="' + config.numberKeywordLookup[searchParts[i].toLowerCase()] + '"]')[0]).children()[0], config.searchShortcut);
                for (var j = 0; j < searchParts.length; j++){
                    if(isNumber(searchParts[j])){
                        strSearch = searchParts[j];
                    }
                }
            }
            else if (searchParts[i].length == 5 && isNumber(searchParts[i]) && searchParts.length<2) {
                for (var j = 0; j < searchParts.length; j++) {
                    if (isNumber(searchParts[j]) && searchParts[j] != searchParts[i]) {
                        return strSearch;
                    }
                }
                config.searchShortcut = "zip:";
                setSearch($($('[rel-shortcut="zip:"]')[0]).children()[0], config.searchShortcut);
                strSearch = searchParts[i];
            }
        }
    }
    return strSearch;
}

function searchAddress(address) {
    //console.log("Geocoding: " + address);
//    var addrObj = {
//        'SingleLine': address
//    }
//    var options = {
//        address: addrObj,
//        outFields: ["Loc_name"]
//    };
//    //optionally return the out fields if you need to calculate the extent of the geocoded point
    //    locator.addressToLocations(options);
    address = encodeURIComponent($.trim(address.split('.').join('')));
    $.jsonp({
        url: config.geocodeUrl + '/' + address,
        timeout: 50000,
        callbackParameter: "callback",
        error: function (xOptions, textStatus) {
//            console.log(xOptions);
//            console.log(textStatus);
            $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that search.</p></div>');
        },
        success: function (data, status) {
            showAddressResults(data);
        }
    });

//    $.ajax({
//        dataType: "jsonp",
//        contentType: "application/json; charset=utf-8",
//        url: config.geocodeUrl + '/'+address,
//        async: false,
//        cache: true,
//        crossDomain: true,
//        timeout: 50000,
//        type: "GET",
//        xhrFields: { withCredentials: false },
//        error: function (jqXHR, textStatus, errorThrown) {
//            console.log(errorThrown + " " + textStatus);
//            $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that search.</p></div>');
//        },
//        statusCode: { 404: function () { $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that search.</p></div>'); } },
//        success: function (data, status) {
//            showAddressResults(data);
//        }
//    });
}

function searchArea(strSearch, layerIds, searchFields) {
    //console.log('searching layer ' + layerIds + ' of ' + config.shortcutSearchServiceUrl + ' for ' + strSearch + ' in ' + searchFields);
    var findTask = new esri.tasks.FindTask(config.shortcutSearchServiceUrl);
    var findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = layerIds;
    findParams.searchFields = searchFields;
    findParams.searchText = strSearch;
    findTask.execute(findParams, showAreaResults);
    $("#SearchDialog .alert").remove();
    $('#AddressSearchText').val(strSearch);
}

function showAddressResults(results) {
    //console.log(results);
    if (results.Locations.length == 1) {
        showAddress(results.Locations[0]);
    }
    else if (results.Locations.length == 0){
        $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that search.</p></div>');
    }
    else{
        results.Locations.sort(function (a, b) {
            if (a.Address.Similarity > b.Address.Similarity)
                return -1;
            if (a.Address.Similarity < b.Address.Similarity)
                return 1;
            if (a.MatchType == 1)
                return -1;
            return 0;
        });
        showAddress(results.Locations[0]);
    }
}

function showAddress(result){
       $('#AddressSearchText').val(result.Address.StandardizedAddress);
        var location = new esri.geometry.Point(result.XCoord, result.YCoord, map.spatialReference);
        var addressResult = new esri.tasks.AddressCandidate();
        addressResult.location = location;
        addressResult.address = result.Address.StandardizedAddress;
        var show;
        if (map.getLevel() != (map.getNumLevels() - 3)) {
            show = function () {
                var def = dojo.connect(map, "onZoomEnd", function () {
                    map.infoWindow.show(location);
                    $('#AddressSearchText').focus();
                    dojo.disconnect(def);
                });
            }
        }
        else {
            show = function () {
                var def = dojo.connect(map, "onPanEnd", function () {
                    map.infoWindow.show(location);
                    $('#AddressSearchText').focus();
                    dojo.disconnect(def);
                });
            }
        }
        idInfo(addressResult);
        map.centerAndZoom(location, map.getNumLevels() - 3);
        show();
        if (isPhone()) {
            $("#SearchDialog").dialog('close');
        }
}

function showAreaResults(results) {
    var markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([0, 255, 0, 0.25]));
    var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 0, 0]), 1);
    var polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([20, 155, 20]), 2), new dojo.Color([20, 155, 20, 0.20]));
    map.graphics.clear();
    if (results.length > 0) {

        var graphic = results[0].feature;
        switch (graphic.geometry.type) {
            case "point":
                graphic.setSymbol(markerSymbol);
                break;
            case "polyline":
                graphic.setSymbol(lineSymbol);
                break;
            case "polygon":
                graphic.setSymbol(polygonSymbol);
                break;
        }
        map.graphics.add(graphic);
        map.setExtent(graphic.geometry.getExtent().expand(1.5));
        showInfo("Search Result", config.shortcutLookup[config.searchShortcut.toLowerCase()].resultLabel + $('#AddressSearchText').val(), graphic.geometry.getExtent().getCenter());
        $(".actionsPane").hide();
        var popupHide = dojo.connect(map.infoWindow, "onHide", function () {
            map.graphics.clear();
            dojo.disconnect(popupHide);
            $(".actionsPane").show();
        });
        if (isPhone()) {
            $("#SearchDialog").dialog('close');
        }
    }
    else {
        //show an error
        $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that search.</p></div>');
    }
}

//function locatorSetup() {
//    locator = new esri.tasks.Locator(config.geocodeUrl);
//    dojo.connect(locator, "onAddressToLocationsComplete", function (geocodeResults) {
//        $("#SearchDialog .alert").remove();

//        if (geocodeResults.length == 0) {
//            //show an error message
//            $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that address.</p></div>');
//        }
//        if (geocodeResults.length > 1) {
//            geocodeResults.sort(function (a, b) {
//                if (a.score > b.score)
//                    return -1;
//                if (a.score < b.score)
//                    return 1;
//                if (a.attributes.Loc_name == "MasterAddress")
//                    return -1;
//                return 0;
//            });
//        }
//        if (geocodeResults[0].score < 75) {
//            //show an error message
//            $("#SearchForm").after('<div class="alert searchError"><a class="close" data-dismiss="alert">×</a><p><strong>Sorry,</strong> we don\'t recognize that address.</p><p>You might try <a class="badge badge-warning" onclick="searchAddress(\'' + geocodeResults[0].address + '\');" href="#">' + geocodeResults[0].address + '</a></p></div>');
//        }
//        else {

//            $('#AddressSearchText').val(geocodeResults[0].address);
//            var show;
//            if (map.getLevel() != (map.getNumLevels() - 3)) {
//                show = function () {
//
//                    var def = dojo.connect(map, "onZoomEnd", function () {
//                        map.infoWindow.show(geocodeResults[0].location);
//                        $('#AddressSearchText').focus();
//                        dojo.disconnect(def);
//                    });
//                }
//            }
//            else {
//                show = function () {
//                    var def = dojo.connect(map, "onPanEnd", function () {
//                        map.infoWindow.show(geocodeResults[0].location);
//                        $('#AddressSearchText').focus();
//                        dojo.disconnect(def);
//                    });
//                }
//            }
//            idInfo(geocodeResults[0]);
//            map.centerAndZoom(geocodeResults[0].location, map.getNumLevels() - 3);
//            show();
//            if (isPhone()) {
//                $("#SearchDialog").dialog('close');
//            }
//        }
//    });
//}

function setSearch(item, strShortcut) {
    if ($("#SearchMore").is(':hidden')) {
            searchToggle();
    }
    config.searchShortcut = strShortcut;
    $('#SearchMore li').removeClass('active');
    $(item).parent().addClass('active');
    $("#AddressSearchText").attr("placeholder", "Search for: " + $(item).text());
}

function searchToggle() {
    $("#SearchMore").slideToggle();
    $("#SearchMoreButton").html($("#SearchMoreButton").html() == '<i class="icon-plus-sign icon-large"></i>&nbsp;&nbsp;Search For:' ? '<i class="icon-minus-sign icon-large"></i>&nbsp;&nbsp;Search For:' : '<i class="icon-plus-sign icon-large"></i>&nbsp;&nbsp;Search For:');
    _gaq.push(['_trackEvent', 'Search', 'SearchToggle', $("#SearchMoreButton").html() == '<i class="icon-plus-sign icon-large"></i>&nbsp;&nbsp;Search For:' ? "Close" : "Open"]);
}

//#endregion

//#region BaseMapSwitcher
function switcherInit(basemapGallery) {
    //adding listeners to show and hide on mouseover and mouseout
    $("#BaseMapSwitcher").mouseenter(switcherShow);
    $("#BaseMapSwitcher").mouseleave(switcherHide);

    //changing the image and text of the selected map icon
    dojo.connect(basemapGallery, "onSelectionChange", changeBaseMapImage);
}

//used to reduce code redundancy when adding multiple maps
function addBaseMap(mapObj, mapArray) {
    var layer = new esri.dijit.BasemapLayer({
        url: mapObj.url
    });
    var baseMap = new esri.dijit.Basemap({
        layers: [layer],
        title: mapObj.title,
        thumbnailUrl: mapObj.thumbnailUrl
    });
    mapArray.push(baseMap);
}

//change the map switcher image based on the selected map (also this won't be shown based on the css classes currently)
function changeBaseMapImage() {
    var basemap = this.getSelected();
    $(".baseMapText").html(basemap.title);
    $(".baseMapImage").css("background-image", "url(" + basemap.thumbnailUrl + ")");
}

//size and make opaque
function switcherShow() {
    $(".baseMapSwitcher").stop(true, true).switchClass("switcher-collapse", "switcher-expand", 300);
    _gaq.push(['_trackEvent', 'BaseMap', 'Switcher', 'Show']);
}

//shrink and make semi transparent (opacity not shown in older browsers)
function switcherHide() {
    $(".baseMapSwitcher").stop(true, true).switchClass("switcher-expand", "switcher-collapse", 300);
    _gaq.push(['_trackEvent', 'BaseMap', 'Switcher', 'Hide']);
}

//#endregion

//#region Base Map Gallery
function createBasemapGallery() {
    //create the basemaps Array
    var basemaps = [];

    //add tiled basemaps to the maps array
    addBaseMap({ url: "http://gis.phila.gov/ArcGIS/rest/services/BaseMaps/GrayBase/MapServer", title: "Streets", thumbnailUrl: "/Map/Content/Images/Streets.jpg" }, basemaps);
    addBaseMap({ url: "http://gis.phila.gov/ArcGIS/rest/services/BaseMaps/Hybrid/MapServer", title: "Hybrid", thumbnailUrl: "/Map/Content/Images/Hybrid.jpg" }, basemaps);
    addBaseMap({ url: "http://gis.phila.gov/ArcGIS/rest/services/BaseMaps/Aerial2010/MapServer", title: "Aerial", thumbnailUrl: "/Map/Content/Images/Aerial.jpg" }, basemaps);

    //build the gallery and start it up (this adds them to the map)
    var basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: false,
        basemaps: basemaps,
        map: map
    }, "BaseMapGallery");
    basemapGallery.startup();

    //will log errors building gallery to the console
    dojo.connect(basemapGallery, "onError", function (error) { console.log(error) });
    dojo.connect(window, "onresize", function () { resizeElements(); });

    //sizing and adding interactivity to the basemap Switcher
    switcherInit(basemapGallery);
}

//#endregion

//#region Map Topics
function initMapTopics() {
    $('#TopicsButton span').button('loading');
    ago4o = new esri.arcgis.Portal(config.ago4oUrl);
    dojo.connect(ago4o, 'onLoad', loadMapTopics);
}

function loadMapTopics() {
    //console.log(ago4o);
    ago4o.queryGroups({ q: 'id: ' + config.ago4oGroup }).then(function (groups) {
        if (groups.results.length > 0) {
            ago4oGroup = groups.results[0];
            //console.log(ago4oGroup);
            ago4oGroup.queryItems({ q: ' type: Web Map', num: 99 }).then(updateMapTopics);
        }
    });
}

function updateMapTopics(queryResponse) {
    var topics = queryResponse.results;
    for (var i = 0; i < topics.length; i++) {
        $("#MapsList").append(buildTopicItem(topics[i]));
        addTopicCategories(topics[i]);
    }
    updateTopicCategories();
    config.topicsLoaded = true;
    $('#TopicsDialog').dialog('open');
    $('#TopicsButton span').button('reset');
    if (config.deptFilter > "") {
        filterDepartment(config.deptFilter);
    }
}

function buildTopicItem(topic) {
    return '<li class="span4 ' + arrayToString(topic.tags) + '"><div class="thumbnail">' +
             '<img src="' + topic.thumbnailUrl + '" alt="">' +
                '<div class="caption"><h5>' + topic.title + '</h5>' +
                  '<p>' + topic.snippet + '</p>' +
                  '<p><a id="' + topic.id.toString().replace(/ /g, "") + '" data-loading-text="Loading..." class="btn btn-primary" title="View Map of ' + topic.title + '" onclick="loadWebMap(' + "'" + topic.id.toString().replace(/ /g, "") + "'" + ',this); _gaq.push([\'_trackEvent\', \'Map\', \'Load\', \'' + topic.title + '\']);">View Map</a> <a href="http://www.arcgis.com/home/item.html?id=' + topic.id + '"target="_blank" title="View Details of ' + topic.title + ' on ArcGIS Online" class="btn">View Details</a></p>' +
               '</div></div>' +
            '</li>';
}

function addTopicCategories(topic) {
    for (var i = 0; i < topic.tags.length; i++) {
        config.topicCategories.push(topic.tags[i]);
    }
}

function updateTopicCategories() {
    config.topicCategories = eliminateDuplicates(config.topicCategories);
    config.topicCategories = config.topicCategories.sort();
    for (var i = 0; i < config.topicCategories.length; i++) {
        if (config.topicCategories[i].substring(0, 4) != "DEPT") {
            $("#TopicsList").append('<li><a tip-data="tooltip-topic" title="Show Only: "  onclick="filterTopics(this);">' + config.topicCategories[i] + '</a></li>');
        }
    }
    $("[tip-data=tooltip-topic]").tooltip({ placement: 'left' });
}

function filterTopics(item) {
    var topicTag = $(item).text().replace(/ /g, "_");
    $('#TopicsList li').removeClass('active');
    $(item).parent().addClass('active');
    $("#DeptFilter").remove();
    switch (topicTag) {
        case "All":
            $('#MapsList li').hide();
            $('#MapsList li').each(function (i) {
                $(this).delay(300 * i).show("drop", { direction: 'right' })
            });
            break;
        default:
            $('#MapsList li').hide();
            $('#MapsList li.' + topicTag).each(function (i) {
                $(this).delay(300 * i).show("drop", { direction: 'right' })
            });
            break;
    }
}

function filterDepartment(strDeptName) {
    $('#MapsList li').hide();
    $('#MapsList li.' + strDeptName).each(function (i) {
        $(this).delay(300 * i).show("drop", { direction: 'right' })
    });
    $("#TopicsList").after('<p class="hero-unit" id="DeptFilter">Your Maps are being filtered based on the site you are visiting from.  To clear this filter, click any option above.</p>');
}

//#endregion

//#region Map Regions

function initMapRegions(){
    $('#RegionsButton span').button('loading');
    config.regionMapLayer = new esri.layers.ArcGISDynamicMapServiceLayer(config.regionMapService);
    map.addLayer(config.regionMapLayer,1);
    config.regionListener = dojo.connect(map, "onLayerAdd", regionLayerLoaded);
}

function regionLayerLoaded(layer) {
    if (layer.url == config.regionMapService) {
        dojo.disconnect(config.regionListener);
        for (var i = 0; i < layer.layerInfos.length; i++) {
            $("#RegionsList").append('<li><a input-data="region" region-data="' + layer.layerInfos[i].id + '" onclick="showRegions(\'' + layer.layerInfos[i].id + '\')" title="Show ' + layer.layerInfos[i].name + '">&nbsp;&nbsp;' + layer.layerInfos[i].name + '</a></li>')
        }
    }
    $('#RegionsDialog').dialog('open');
    config.regionsLoaded = true;
    $('#RegionsButton span').button('reset');
}

function showRegions(item) {
    if($("[region-data=" + item + "]").parent().hasClass('active')){
        $("[input-data=region]").parent().removeClass('active');
        getRegionLayer().setVisibleLayers([-1]);
        if (isPhone()) {
            $('#RegionsDialog').dialog('close');
        }
    }
    else {
        $("[region-data=" + item + "]").parent().addClass('active');
        $("[input-data=region]").parent().removeClass('active');
        $("[region-data=" + item + "]").parent().addClass('active');
        //turn on only checked layer
        getRegionLayer().setVisibleLayers([item]);
        if (isPhone()) {
            $('#RegionsDialog').dialog('close');
        }
    }
}

function getRegionLayer() {
    var mapLayer;
    for (var i = 0; i < map.layerIds.length;i++ ) {
        if (map.getLayer(map.layerIds[i]).url == config.regionMapService) {
            mapLayer = map.getLayer(map.layerIds[i]);
            break;
        }
    }
    if (mapLayer == undefined) {
        map.addLayer(config.regionMapLayer, 1);
        mapLayer = config.regionLayer;
    }
    return mapLayer;
}

//#endregion

//#region Web Maps

function loadWebMap(id, element) {
    console.log("loadWebMap");
    console.log(id);
    console.log(element);
    if (config.mapId != id) {
        if (element != undefined) {
            $("#" + element.id).button('loading');
        }
        var mapOptions;
        var popup;
        if (isPhone()) {
            popup = new esri.dijit.PopupMobile(null, dojo.create("div"));
        }
        else {
            popup = new esri.dijit.Popup(null, dojo.create("div"));
        }
        if (map.extent) {
            mapOptions = { infoWindow: popup, logo:false, extent: map.extent };
        }
        else {
            mapOptions = { infoWindow: popup, logo: false };
        }
        mapDestroy();

        var mapDeferred = esri.arcgis.utils.createMap(id, "map", {
            geometryServiceURL: config.geometryUrl, mapOptions: mapOptions
        });
        mapDeferred.addCallback(function (response) {
            //console.log(response);
            if (id != config.baseMapID) {
                window.location.hash = "#id=" + id;
                config.mapId = id;
                addMapTab(id, response.itemInfo.item.title);
                var mapTitle = response.itemInfo.item.title;
                //console.log('Opening map: ' + mapTitle);
                _gaq.push(['_trackEvent', 'Map', 'OpenMap', mapTitle]);
            }
            map = response.map;

            registerLoading();
            var layers = response.itemInfo.itemData.operationalLayers;
            config.layersLoaded = layers;
            if (map.loaded) {
                initMap(layers);
                if (config.regionMapLayer != undefined) { map.addLayer(config.regionMapLayer, 1); }
            }
            else {
                dojo.connect(map, "onLoad", function () {
                    initMap(layers);
                    if (config.regionMapLayer != undefined) { map.addLayer(config.regionMapLayer, 1); }

                });
            }
        });
        mapDeferred.addErrback(function (error) {
            console.log("Map creation failed: ", dojo.toJson(error));
        });
    }
}

function addMapTab(id, title) {
    if (!isPhone()){
    $('.tab-btn').removeClass('active');
    if (!$('#'+id+'Tab').text().length > 0) {
        $("#MapSelectors").append('<a id="' + id + 'Tab" href="#id=' + id + '" class="tab-btn btn"><i class="icon-map-marker"></i>&nbsp;' + title.replace(' (stage)', '') + '&nbsp;<button onclick="mapRemove(this);" class="close" data-dismiss="alert">×</button></a>');
    }
    $('#' + id + 'Tab').addClass('active');
    }
}

function mapDestroy() {
    map.destroy();
    dijit.byId("BaseMapGallery").destroy();
    $("#BaseMapSwitcher").remove();
    $("#map").append('<div class="baseMapSwitcher switcher-collapse" id="BaseMapSwitcher"><div class="selectedBaseMap"><div class="baseMapImage esriBasemapGalleryThumbnail"></div><div class="baseMapText"></div></div><div id="BaseMapGallery" class="gallery"></div></div>');
    if (dijit.byId("LegendContent")) {
        dijit.byId("LegendContent").destroy();
        $("#LegendDialog").append('<div id="LegendContent"></div>');
    }
}

function mapRemove(button) {
    if ($(button).parent().hasClass('active')) {
        loadWebMap(config.baseMapID);
        window.location.hash = "";
    }
}

var clickEvt;

function initMap(layers) {
    $('#TopicsDialog').dialog('close');
    $('.caption .btn-primary').button('reset');
    createBasemapGallery();
    dijit.byId("BaseMapGallery").select("basemap_0");
    //add a legend

    //Make sure only layers configured in AGO4O show
//    var hiddenLegendLayers = [];

//    for (i = 0; i < layers.length; i++) {
//        var thisLayer = layers[i];
//        console.log(thisLayer);
//        for (i = 0; i < thisLayer.layers.length; i++) {
//            if (thisLayer.layers[i].showLegend === false) {
//                hiddenLegendLayers.push(thisLayer.layers[i].id);
//            } else {
//            }
//        }

//    }

    var layerInfo = dojo.map(layers, function (layer, index) {
        return { layer: layer.layerObject, title: layer.title }; // used to have hideLayers: hiddenLegendLayers
    });
    var overviewMapDijit = new esri.dijit.OverviewMap({
        map: map,
        visible: false,
        attachTo: 'bottom-right'
    });
    overviewMapDijit.startup();

    if (layerInfo.length > 0) {
        var legendDijit = new esri.dijit.Legend({
            map: map,
            layerInfos: layerInfo
        }, "LegendContent");
        legendDijit.startup();
    }
    else {
        dojo.byId('LegendContent').innerHTML = 'No operational layers';
    }
    dojo.connect(map, "onZoomEnd", checkScales);
    $(".scaleAlert").show();
    if ($("#LegendButton").is(':hidden')) {
        $("#LegendButton").show("slide", { direction: "right" }, 500);
    }

    if (!isPhone() && browserGrade() == "A") {
        //adding the popout button, I only do this if we are not on mobile and we are in a grade a browser
        var popup = map.infoWindow;
        $('.maximize').hide();
        $('.titleButton.close').before('<i id="PopoutButton" class="titleButton popoutIcon icon-external-link mirror"></i>');
        $('#PopoutButton').click(dataPanel.open);
        //dojo.connect(dojo.byId("#PopoutButton"), "onClick", addToDataPanel);
        // SIDE PANEL STILL IN THE WORKS
        //enableSlidePanel();
        // On map clicks, save evt to a global object clickEvt
        //dojo.connect(map, 'onClick', setEvt);
    }
}

//// SIDE PANEL STILL IN THE WORKS
//function setEvt(evt) {
//    console.log("in setEvt()");
//    clickEvt = evt;
//}

//var dataPanel = {
//    trigger: { tag: '.toggle',
//        button: '.btn-toggle'
//    },

//    panel: { tag: '.popout',
//        open: false
//    },

//    handlers: ['sendToDataPanel'],


//    open: function () {

//        //console.log(this);
//        console.log("In open...");
//        $('.esriPopup').hide();
//        //var openDataPanelEventHandler = dojo.connect(dojo.byId("g#map_graphics_layer"), "onClick", addToDataPanel);
//        console.log("Animating...");
//        $(dataPanel.panel.tag).animate({ 'left': '0px' });
//        $(dataPanel.trigger.tag).animate({ 'left': '280px' });
//        //$('#map_zoom_slider').addClass('mapRight', 350);
//        $(dataPanel.trigger.button).removeClass('icon-caret-right').addClass('icon-caret-left');
//        //fetch(clickEvt);
//        if (clickEvt) {
//            console.log("There's a click event...");
//            addToDataPanel(clickEvt);
//        }

//        //$('.btn-group').addClass('mapRight', 350);
//        dataPanel.panel.open = true;
//        console.log("Done animating");
//        dataPanel.handlers['sendToDataPanel'] = dojo.connect(map, "onClick", addToDataPanel);
//        //console.log(dataPanel.handlers['sendToDataPanel']);
//    },

//    close: function () {
//        console.log("In close...");
//        //console.log(dataPanelEventHandler);
//        console.log('Removing the event handlers...');
//        dojo.disconnect(this.handlers['sendToDataPanel']);
//        console.log('Handlers removed');
//        //console.log(dataPanelEventHandler);
//        $('.esriPopup').show();
//        $(this.panel.tag).animate({ 'left': '-300px' });
//        $(this.trigger.tag).animate({ 'left': '-20px' });
//        $('#map_zoom_slider').removeClass('mapRight', 350);
//        $('.btn-group').removeClass('mapRight', 350);
//        $(this.trigger.button).removeClass('icon-caret-left').addClass('icon-caret-right');
//        this.panel.open = false;
//        console.log("All done in close.");
//    }
//};

//function unloadDataPanelEvents() {
//    console.log("In unloadDataPanelEventHandler()");
//    dojo.disconnect(openDataPanelEventHandler);
//    dojo.disconnect(closeDataPanelEventHandler);
//};

//var dataPanelEventHandler;

//function enableSlidePanel() {

//    $(dataPanel.trigger.tag).show();

//    $(dataPanel.trigger.tag).bind('click', function () {

//        if (!dataPanel.panel.open) {
//            console.log('Side panel wasn\'t out...');
//            dataPanel.open();
//            addToDataPanel();

//        } else {
//            console.log('Side panel was out...');
//            //var closeDataPanelEventHandler = dojo.connect(dojo.byId("g#map_graphics_layer"), "onUnload", unloadDataPanelEvents);
//            dataPanel.close();
//        }

//    });
//}

//function addToDataPanel(evt) {

//    console.log("In addToDataPanel()");
//    console.log(evt);

//    $('.esriPopup').hide();

//    if (!dataPanel.panel.open) {
//        dataPanel.open();
//    }

//

//    fetchData(evt)
//    //$('#ItemList').append(featureHTML);

//}

//function fetchData(evt) {
//    console.log("in fetchData");

//    //var geometry = evt.graphic.geometry;

//    var loadedServices = [];

//    for (var i = 0; i < config.layersLoaded.length; i++) {
//        loadedServices.push(config.layersLoaded[i].url);
//    }

//    var deferred;

//    var identifyParams = new esri.tasks.IdentifyParameters();
//    identifyParams.tolerance = 1;
//    identifyParams.returnGeometry = false;
//    identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
//    identifyParams.width = map.width;
//    identifyParams.height = map.height;
//    identifyParams.geometry = evt.mapPoint;
//    identifyParams.mapExtent = map.extent;

//    var queryList = {};
//    var deferredArray = [];

//    for (var j = 0; j < loadedServices.length; j++) {

//        queryList['query' + j] = {};

//        queryList['query' + j]['task'] = new esri.tasks.IdentifyTask(loadedServices[j]);
//        queryList['query' + j]['deferred'] = queryList['query' + j]['task'].execute(identifyParams);
//        deferredArray.push(queryList['query' + j]['deferred']);
//    }

//    var deferredList = new dojo.DeferredList(deferredArray);
//    console.log(deferredList);
//    deferredList.then(showData);
//}


//        identifyTask.execute(identifyParams, function (results) {
//            console.log("Executing...");
//            console.log(results);
//            console.log(results.length);
//            console.log(map.infoWindow.features.length);
//            //$('#ItemList').append('<li><a>' + map.infoWindow.features[i].getTitle() + '</a></li>')
//            for (var i = 0; i < map.infoWindow.features.length; i++) {
//                console.log("In for loop...");
//                console.log(i);
//                console.log(map.infoWindow.features[i]._graphicsLayer._map.infoWindow._contentPane.children[0].innerHTML);
//                if (map.infoWindow.features[i]._count != 0) {
//                    $('#ItemList').append(map.infoWindow.features[i]._graphicsLayer._map.infoWindow._contentPane.children[0].innerHTML + '<br />');
//                }
//            }
//        });

//var showData = function (results) {
//    console.log("In showData...");

//    $('#ItemList').empty();

//    //console.log(results);
//    console.log("Number of features: " + map.infoWindow.features.length);

//    for (var i = 0; i < map.infoWindow.features.length; i++) {
//        $('#ItemList').append('<h3><a>' + map.infoWindow.features[i].getTitle() + '</a></h3>')
//        //console.log("In for loop...");
//        //console.log(i);
//        //console.log(map.infoWindow.features[i]._graphicsLayer._map.infoWindow._contentPane.children[0].innerHTML);
//        //console.log(map.infoWindow.features[i]);
//        //$('#ItemList').append(map.infoWindow.features[i]._graphicsLayer._map.infoWindow._contentPane.children[0].innerHTML + '<br />');
//        //console.log(map.infoWindow.features[i].getContent());
//        //var html = map.infoWindow.features[i]._graphicsLayer._map.infoWindow._contentPane.children[0].innerHTML;
//        //console.log(map.infoWindow.features[i].getTitle());
//        //console.log(html);

//        var template = map.infoWindow.features[i]._graphicsLayer.infoTemplate.info.description;
//        var attributes = map.infoWindow.features[i].attributes;

//        //console.log(template);
//        //console.log(attributes);

//        var re = /\{[A-Z1-9_]+\}/g;

//        var html;

//        //console.log("Number of template reg ex matches: " + matches.length);

//        var matchNum = template.match(re).length;

//        for (var j = 0; j < matchNum; j++) {

//            //while (re.test(template)) {
//            //console.log(re.test(template));
//            //while (template.match(re).length > 0) {
//            //console.log("In while loop...");
//            var matches = template.match(re);
//            //console.log("Number of matches: " + matches.length);
//            var match = matches[0];
//            //console.log(match);
//            var replacement = attributes[match.replace('{', '').replace('}', '')];
//            //console.log(replacement)
//            if (!replacement) {
//                template = template.replace(match, '');

//            } else {
//                template = template.replace(match, replacement);
//            }
//            //console.log(template);
//        }



        //        for (i = 0; i < matches.length; i++) {

        //            var matches = template.match(re);

        //            var match = matches[i];
        //            console.log(match);
        //            template = template.replace(match, attributes[match.replace('{', '').replace('}', '')]);
        //            console.log(template);
        //        }

        //        matches = '';

        //        //console.log(html);

//        var html = '<p><div class="panel-details">' + template + '</div></p>';

//        $('#ItemList').append(html);
//    }
//}





//function addDataToPopout() {
//    console.log("In addDataToPopout");
////    // This is async, have to wait until the data is ready before you can populate the DOM!
//    $('#ItemList').empty();
//    for (i = 0; i < map.infoWindow.features.length; i++) {
//        var fields = getVisibleFields(map.infoWindow.features[i]);
//        //console.log(fields);
//        var attributes = map.infoWindow.features[i].attributes;
//        //$('#ItemList').append('<li>');
//        $('#ItemList').append('<h3 class="title">' + map.infoWindow.features[i].getTitle() + '</h3>');
//        for (field in fields) {
//            //console.log(attributes[fields[field]]);
//            $('#ItemList').append('<li>' + fields[field] + ' : ' + attributes[fields[field]] + '</li>');
//        }
//    }
//}





//function popout() {
    //console.log(map.infoWindow.features);
    //console.log(map.infoWindow.features[0]._graphicsLayer.infoTemplate.title);
    //console.log(map.infoWindow.features[0]._graphicsLayer.infoTemplate.info);

    //console.log(fieldsInfo);



//    for (var i = 0; i < map.infoWindow.features.length; i++) {
//        $('#ItemList').append('<li><a>' + map.infoWindow.features[i].getTitle() + '</a></li>')
//        var attributes = map.infoWindow.features[i].attributes;
//        var fieldsInfo = map.infoWindow.features[0]._graphicsLayer.infoTemplate.info.fieldInfos;
//        for (var k = 0; k < fieldsInfo.length; k++) {
//            console.log(fieldsInfo);
//            if (fieldsInfo[k].visible === true) {
//                console.log(fieldsInfo[k].fieldName);
//                var visibleProp = fieldsInfo[k].fieldName;
//                $('#ItemList').append('<li>' + visibleProp + ' : ' + attributes[visibleProp] + '</li>');
//            }
//            //console.log(fieldsInfo[k].visible);
//        }

    //    }


        //console.log("Let's try regex matching!");


        // If the pop-up wasn't built as a "custom attribute display" in AGO4O, than popupHtml will be null
        // In these cases, the visible fields that should be included in the data pane are at
        // map.infoWindow.features[i]._graphicsLayer.infoTemplate.info.fieldInfos[j].visible === true
        // The title can also be grabbed at info.title
        // In these cases, push to visibleFields with these .fieldNames instead of the regex
        // Should probably put into a separate function that returns the array that this function can work on
        // getVisibleFields()?
        //
    //console.log(visibleFields);
    //addDataToPopout();
//        for (i = 0; i < map.infoWindow.features.length; i++) {
//            var fields = getVisibleFields(map.infoWindow.features[i]);
//            //console.log(fields);
//            var attributes = map.infoWindow.features[i].attributes;
//            //$('#ItemList').append('<li>');
//            $('#ItemList').append('<h3 class="title">' + map.infoWindow.features[i].getTitle() + '</h3>');
//            for (field in fields) {
//                //console.log(attributes[fields[field]]);
//                $('#ItemList').append('<li>' + fields[field] + ' : ' + attributes[fields[field]] + '</li>');
//            }
//        }
//
        //console.log(attributes);
    //$('#ItemList').append(popupHtml);






    //console.log(map.infoWindow.deferreds); //if that thing is still spinning all the features ahven't been recieved from the server.  There are events that say everything has been downloaded.
    //$('.esriPopup').hide();
    //slidePanel();

    //$('#map').addClass("mapRight", 500);
    //setTimeout(function () { map.resize(); }, 501);
    //$(".popout").show();
//    for (var i = 0; i < map.infoWindow.features.length; i++) {
//        $('#ItemList').append('<li><a>' + map.infoWindow.features[i].getTitle() + '</a></li>')
//        var attributes = map.infoWindow.features[i].attributes;
//        //console.log(attributes);
//        for (var prop in attributes) {
//            $('#ItemList').append('<li>' + prop + ' : ' + attributes[prop] + '</li>');
//            console.log(prop);
//            //$('#ItemList').append('<li>'
//        }

//        //$('#ItemList').append('<li>' +
//        //$('#ItemList').append('</li>');
//    }
    // Style this like Trello's side bar collapse
    //$('#ItemList').append('<h4 class="btn-close-popout">Close</h4>');
    //$(".close-popout").click(popIn);
    //    console.log("New connect");
    // This screws everything up if the popout is opened with a feature clicked on first
    //popoutEventHandler = dojo.connect(dojo.byId("g#map_graphics_layer"), "onclick", null, addToDataPanel);
    // Put population of sidebar data into separate function so that this event handler can call it ^

//    function sidebarOpen() {
//        console.log("OHHAI");
//    }

//}

//function getVisibleFields(featureObject) {
//    console.log("in getVisibleFields");
//    //console.log(featureObject);
//    var popupHtml = featureObject._graphicsLayer.infoTemplate.info.description;
//    if (popupHtml === null) {
//        console.log("Not a custom popup...");
//        var fieldInfos = featureObject._graphicsLayer.infoTemplate.info.fieldInfos;
//        var visibleFields = [];
//        for (var i = 0; i < fieldInfos.length; i++) {
//            //console.log(fieldInfos[i]);
//            if (fieldInfos[i].visible === true) {
//                visibleFields.push(fieldInfos[i].fieldName);
//            }
//        }
//        console.log(visibleFields);
//        return visibleFields;

//    } else {
//        console.log("It's a custom popup...");
//        console.log(popupHtml);
//        console.log(featureObject.attributes);
//        var re = /[A-Z|_]{2,30}/g;
//        console.log(popupHtml.match(re));
//        return popupHtml.match(re);
//    }
//}

//this will get rid of the popout, but not destroy the list, just hide it.
//function popIn() {
//    dojo.disconnect(popoutEventHandler);
//    //$(".popout").hide('slow');
//    $('.popout').hide('slide', { direction: 'left' }, 500);
//    $('#ItemList').empty();
//    $('#map_zoom_slider').removeClass("mapRight", 550);
//    //setTimeout(function () { map.resize(); }, 501);
//    $('.esriPopup').show();
//}

//#endregion


//#region Utilities


function showInfo(title, content, location) {
    map.infoWindow.setTitle(title);
    map.infoWindow.setContent(content);
    map.infoWindow.show(location);
}

function idInfo(addressResult) {
    var query = new esri.tasks.Query();
    query.geometry = new esri.geometry.Polygon(map.spatialReference);
    query.geometry.addRing(ringFromPoint(addressResult.location, 3));
    var selectFeaturesDeferreds = dojo.map(map.graphicsLayerIds, function (graphicsLayerId) {
        return map.getLayer(graphicsLayerId).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
    });

    map.infoWindow.setFeatures(selectFeaturesDeferreds);
    map.infoWindow.setTitle("Address Search Result");
    map.infoWindow.setContent(addressResult.address);
}

function checkScales() {
    var scale = esri.geometry.getScale(map);
    for (var i = 0; i < map.graphicsLayerIds.length; i++) {
        if (map.getLayer(map.graphicsLayerIds[i]).minScale < scale) {
            $(".scaleAlert").show();
            return null;
        }
    }
    $(".scaleAlert").hide();
 }

function ringFromPoint(geom, dist) {
    var arr = new Array();
    arr.push(geom.offset(dist*-1, dist));
    arr.push(geom.offset(dist, dist));
    arr.push(geom.offset(dist, dist*-1));
    arr.push(geom.offset(dist*-1, dist*-1));
    arr.push(geom.offset(dist * -1, dist));
    return arr;
}

function eliminateDuplicates(arr) {
    var i, len = arr.length, out = [], obj = {};
    for (i = 0; i < len; i++) {
        obj[arr[i]] = 0;
    }
    for (i in obj) {
        out.push(i);
    }
    return out;
}

function arrayToString(arr) {
    var str = "";
    for (i = 0; i < arr.length; i++) {
        str = str + arr[i].toString().replace(/ /g, "_") + " ";
    }
    str = str.replace(/DEPT:/g, "");
    return str;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function browserGrade() {
    if ($.browser.msie && $.browser.version.substr(0, 1) > 6) {
        var cssAttributeNames = ['BorderRadius', 'MozBorderRadius', 'WebkitBorderRadius', 'OBorderRadius', 'KhtmlBorderRadius', 'borderRadius'];
        for (var i = 0; i < cssAttributeNames.length; i++) {
            var attributeName = cssAttributeNames[i];
            if (window.document.body.style[attributeName] !== undefined) {
                return "A";
            }
        }
        return "B";
    }
    else if ($.browser.msie && $.browser.version.substr(0, 1) < 7) {
        return "F";
    }
    else {
        var cssAttributeNames = ['BorderRadius', 'MozBorderRadius', 'WebkitBorderRadius', 'OBorderRadius', 'KhtmlBorderRadius', 'borderRadius'];
        for (var i = 0; i < cssAttributeNames.length; i++) {
            var attributeName = cssAttributeNames[i];
            if (window.document.body.style[attributeName] !== undefined) {
                return "A";
            }
        }
        return "B";
    }
}

function compatCheck(){
    switch (browserGrade()) {
        case "F":
            alert("This browser is not supported, please upgrade or use a different browser.");
            //$("#map").append('<div class="alert alert-error browserAlert"><button class="close" data-dismiss="alert">×</button><strong>Error!</strong> This browser is not supported, and the application may not function properly.</div>');
            break;
        case "B":
            //console.log("Browser is supported but not optimal");
            $("#map").append('<div class="alert browserAlert"><button class="close" data-dismiss="alert">×</button>This application is optimized to take advantage of modern browsers.  Please upgrade your browser for a better experience.</div>');
            break;
        case "A":
            //console.log("Browser is fully supported");
            break;
        default:
            //console.log("browserGrade() function not working");
            break;
    }
}

function getUrlVar(key) {
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.hash.substring(1, window.location.hash.length));
    return result && result[1] || "";
}

function isTouchDevice() { var el = document.createElement('div'); el.setAttribute('ontouchmove', 'return;'); return typeof el.ontouchmove == "function"; }

function isTabletOrLess() {if ($(window).width() <= 1020) { return true; }  else { return false; }};

function isPhone() { if ($(window).width() <= 480) { return true; } else { return false; } };

var Storage = (function () {
    var cookieStorage = {
        expires: 30,
        getItem: function (key) {
            return $.cookie(key);
        },
        setItem: function (key, value) {
            return $.cookie(key, value, { path: "/", expires: this.expires });
        },
        removeItem: function (key) {
            return $.cookie(key, null);
        }
    };
    var engine = cookieStorage;
    try {
        if ("localStorage" in window && window["localStorage"] !== null) {
            engine = window.localStorage;
        }
    } catch (e) {
    }
    return function (namespace) {
        if (!namespace) {
            namespace = '';
        }
        return {
            get: function (key) {
                return engine.getItem(namespace + "-" + key);
            },
            set: function (key, value) {
                return engine.setItem(namespace + "-" + key, value);
            },
            remove: function (key) {
                return engine.remoteItem(namespace + "-" + key);
            }
        }
    }
})();
//#endregion