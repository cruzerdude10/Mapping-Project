//#region GLOBAL VARS
var map;
var searchManager;
var savedLocations;
var currentSearch;
var isDrawing = false;
const bingMapKey = 'AoVQbviR4QriUaesKy9WKjQb0EBSpN4MOa1Dr2SvkGe3JRS18-WJoKzpOEo_RL7S';

//INPUT VARS
//searchTerm
searchTerm = document.getElementById("search-Input");
//searchType
searchType = document.getElementById("search-Type");
//userPostion

//#endregion

//#region Classes  
class point{
    constructor(latitude, longitude){
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
class info{
    constructor(website, phonenumber){
        this.phoneNumber = phonenumber;
        this.website = website;
        this.entityType = entityType;
    }
}
class searchResult{
    constructor(name, address, point, info){
        this.name = name;
        this.address = address;
        this.point = point;
        this.info = info;
    }
}
//#endregion

//Write Search Results to HTML, and Load Map Pins
function loadResults(){
    for (let index = 0; index < currentSearch.length; index++) {
        const locationData = currentSearch[index];
        createResultElements(index);
        writeResult(index, locationData);
    }
    pinLocations(currentSearch);
}
//#region Init
function loadMapScenario() {
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        credential: bingMapKey
    }); 

    loadDrawingTools();
}
//#endregion

//#region Search Functions
    //gets and returns text in search box
        function getSearchTerm(){
            searchTerm = document.getElementById("search-Input").value;
            return searchTerm;
        }

    //gets and returns search type
        function getSearchType(){
            searchType = document.getElementById("type-Input").value;
            return searchType;
        }

    //search address and returns a postion
        function geocodeQuery(query){
            //check searchManager is loaded
            if (!searchManager){
                Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
                    searchManager = new Microsoft.Maps.Search.SearchManager(map);
                    geocodeQuery(query);
                });
            }
            else {
                var searchRequest = {
                    where: query,
                    callback: function (r) {
                        if (r && r.results && r.results.length > 0) {
                            //set pins on maps
                            pinPoint(r.results[0].location);
                        }
                    },
                    errorCallback: function (e) {
                        alert("no results found.")
                    }
                };
                searchManager.geocode(searchRequest);
            } 
        }
//#endregion

//#region AJAX Request
    function requestPOIUrl(term){
        var userLocation = map.getCenter();
        var latitude = userLocation.latitude.toString().substr(0,8);
        var longitude = userLocation.longitude.toString().substr(0,8);
        const ajax = new XMLHttpRequest;

        //check if user wants to check via area
        const requestUrl = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${term}&userLocation=${latitude},${longitude}&key=${bingMapKey}`;
        
        const requestMethod = 'GET';
        const asyncRquest = true;
        ajax.open(requestMethod, requestUrl, asyncRquest);
        ajax.onreadystatechange = callbackPOI;
        var data = ajax.send();
    }
    function callbackPOI(){
        var responseStatusOk = this.status === 200;   //STATUS 200 means OK
        var responseComplete = this.readyState === 4; //readyState 4 means response is ready

        if(responseStatusOk && responseComplete){
            console.log(this.responseText); //debug

            //PARSE THE RESPONSE
            let responseData = JSON.parse(this.responseText);
            currentSearch = responseData.resourceSets[0].resources;
            loadResults();
        }else{
            //SOMETHING WENT WRONG
            console.warn();
        }//end if
    }
    function requestPOIBBox(term){
        iprimitives = DrawingManager.getPrimitives()
        var bBox = getBoundingBox(iprimitives[0]);
        var bbNorth = trimCoord(bBox.bounds[0]);
        var bbEast = trimCoord(bBox.bounds[1]);
        var bbSouth = trimCoord(bBox.bounds[2]);
        var bbWest = trimCoord(bBox.bounds[3]);
        const ajax = new XMLHttpRequest;

        //check if user wants to check via area
        const requestUrl = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${term}&userMapView=${bbNorth},${bbEast},${bbSouth},${bbWest}&key=${bingMapKey}`;
        
        const requestMethod = 'GET';
        const asyncRquest = true;
        ajax.open(requestMethod, requestUrl, asyncRquest);
        ajax.onreadystatechange = callbackPOI;
        var data = ajax.send();
    }
//#endregion

    function trimCoord(coord){
        var newCoord;
        if (coord < 0) {
            coord *= -1;
        }
        var stringCoord = coord.toString();
        newCoord = stringCoord.substr(0,8);
        return newCoord;
    }

//#region Shapes
    function getBoundingBox(iPrimitive){
        var shapes = iPrimitive;
        var boundingBox = new Microsoft.Maps.LocationRect.fromShapes(shapes);
        return boundingBox;
    }
    function toggleIsDrawing(){
        var notSameBool = !isDrawing;
        isDrawing = notSameBool;
    }
    function loadDrawingTools(){
         //load drawing tools
        Microsoft.Maps.loadModule('Microsoft.Maps.DrawingTools', function () {
            var tools = new Microsoft.Maps.DrawingTools(map);

            tools.showDrawingManager(function (manager) {
                DrawingManager = manager;

                Microsoft.Maps.Events.addHandler(DrawingManager, 'drawingStarted', function () {toggleIsDrawing(); });
                Microsoft.Maps.Events.addHandler(DrawingManager, 'drawingEnded', function () {toggleIsDrawing(); });
                Microsoft.Maps.Events.addHandler(DrawingManager, 'drawingChanging', function () {toggleIsDrawing(); });
            })
        });
    }
    //limit shapes, closed polygon

//#endregion

//#region Saved Locations

    //write saved Locations to HTML and Set Pins on Map
    function loadSavedLocations(){

    }

    //move location to saved
    function addSavedLocation(id){
        var index = savedLocations.length;
        savedLocations[index] = currentSearch[id];
        var saveIcon = document.getElementById(`save-Icon-${id}`);
        saveIcon.setAttribute("src","\images\\heart-filled.svg")
    }

    //find the index of the location stored in savedLocation
    function findSave (locationData){
        if (savedLocations == undefined) {
            return -1;
        }
        var indexFound = 0;
        for (let index = 0; index < savedLocations.length; index++) {
            const currentLocation = savedLocations[index];
            if (currentLocation.Address.formattedAddress == locationData.Address.formattedAddress) {
                indexFound = index;
            }
        }
        return indexFound;
    }

    //returnz correct image source location on saved status
    function checkSaveStatus(locationData){
        var saveIndex = findSave(locationData);
        if (saveIndex >= 0) {
            return "\images\\heart-filled.svg";
        }
        else {
            return "\images\\heart.svg";
        }
    }

    //removes Saved Location from Array based on index of object 
    function removeSave(index){
        var newSaved;
        var newIndex = 0;
        for (let oldIndex = 0; i < savedLocations.length; oldIndex++) {
            const location = array[oldIndex];
            if (oldIndex != index) {
                newSaved[newIndex] = location;
                newIndex++;
            }
        }
        savedLocations = newSaved;
    }
//#endregion

//#region Events
    //search button event
    function callSearch(){
        currentSearch = null;
        var region = document.querySelector('.results-Region');
        region.innerHTML = "";
        map.entities.clear()
        var type = getSearchType();
        var term = getSearchTerm();

        if (type == "interests") {
            requestPOIUrl(term);
        }
        else if (type == "geocode") {
            geocodeQuery(term);
        }
        else if (type == "saved"){
            //add saved location query
        }
        else if(type == "area"){
            var shapes = DrawingManager.getPrimitives();
            if (shapes.length > 0) {  
                requestPOIBBox(term);
            }
        }
    }

    //Event to save Location
    function saveResult(id){
        addSavedLocation(id);
        //query select div
        //change img src
    }

    //will load directions to given location
    function directionResult(id){

    }

    //creates HTML for side panel that displays results 
    function createResultElements(id){

        //create elements
        var region = document.querySelector('.results-Region');
            var result = document.createElement("section");
                var hero = document.createElement("div");
                    var heroImage = document.createElement("img"); 
                    var heroName = document.createElement("div");
                    var heroAddress = document.createElement("div");
                var options = document.createElement("div");
                    //save
                        var saveOption = document.createElement("div");
                        var saveLabel = document.createElement("div");
                        var saveIcon = document.createElement("img");
                    //direction
                        var directionOption = document.createElement("div");
                        var directionLabel = document.createElement("div");
                        var directionIcon = document.createElement("img");
                    //contact
                        var contactOption = document.createElement("div");
                        var websiteLink = document.createElement("a");
                            var websiteIcon = document.createElement("img");
                        var phoneIcon = document.createElement("div");
    
        //assign IDs ---- Do I need this? can i just take the var and directly assign data  not like its changing anyway except the buttons?
        result.setAttribute("id", `result-${id}`);
            hero.setAttribute("id",`hero-${id}`);
                heroImage.setAttribute("id",`image-${id}`);
                heroName.setAttribute("id",`name-${id}`);
                heroAddress.setAttribute("id",`address-${id}`);
            options.setAttribute("id",`options-${id}`);
                saveOption.setAttribute("id",`save-${id}`);
                    saveLabel.setAttribute("id",`save-Label-${id}`);
                    saveIcon.setAttribute("id",`save-Icon-${id}`);
                directionOption.setAttribute("id",`direction-${id}`);
                    directionLabel.setAttribute("id",`direction-Label-${id}`);
                    directionIcon.setAttribute("id",`direction-Icon-${id}`);
                contactOption.setAttribute("id",`contact-${id}`);
                    websiteLink.setAttribute("id", `link-${id}`);
                    websiteIcon.setAttribute("id",`website-${id}`);
                    phoneIcon.setAttribute("id",`phone-${id}`);
    
        //assign classes
        result.setAttribute("class", "result");
            hero.setAttribute("class","result-Hero");
                heroImage.setAttribute("class","result-Image");
                heroName.setAttribute("class","result-Title");
                heroAddress.setAttribute("class","result-Address");
            options.setAttribute("class","results-Options");
                saveOption.setAttribute("class","result-Btn");
                    saveLabel.setAttribute("class","button-Label");
                    saveIcon.setAttribute("class","button-Icon");
                directionOption.setAttribute("class","result-Btn");
                    directionLabel.setAttribute("class","button-Label");
                    directionIcon.setAttribute("class","button-Icon");
                contactOption.setAttribute("class","result-Btn");
                    websiteIcon.setAttribute("class","button-Icon")
                    phoneIcon.setAttribute("class","button-Label");
    
        //nest
        region.appendChild(result)
        result.appendChild(hero);
            //inside Hero
            hero.appendChild(heroName);
            hero.appendChild(heroImage);
            hero.appendChild(heroAddress);
        result.appendChild(options);
            //inside Options
            options.appendChild(saveOption);
                //in save
                saveOption.appendChild(saveLabel);
                saveOption.appendChild(saveIcon);
            options.appendChild(directionOption);
                //in direction
                directionOption.appendChild(directionLabel);
                directionOption.appendChild(directionIcon);
            options.appendChild(contactOption);
                //in contact 
                contactOption.appendChild(phoneIcon);
                contactOption.appendChild(websiteLink);
                    websiteLink.appendChild(websiteIcon);
    }

    //fills data for HTML 
    function writeResult(id, resultData){
        //VARs
        
                var hero = document.getElementById(`hero-${id}`);
                    var heroImage = document.getElementById(`image-${id}`); 
                    var heroName = document.getElementById(`name-${id}`);
                    var heroAddress = document.getElementById(`address-${id}`);
                var options = document.getElementById(`options-${id}`);
                    //save
                        var saveOption = document.getElementById(`save-${id}`);
                        var saveLabel = document.getElementById(`save-Label-${id}`);
                        var saveIcon = document.getElementById(`save-Icon-${id}`);
                    //direction
                        var directionOption = document.getElementById(`direction-${id}`);
                        var directionLabel = document.getElementById(`direction-Label-${id}`);
                        var directionIcon = document.getElementById(`direction-Icon-${id}`);
                    //contact
                        var contactOption = document.getElementById(`contact-${id}`);
                        var websiteLink = document.getElementById(`link-${id}`);
                        var websiteIcon = document.getElementById(`website-${id}`);
                        var phoneIcon = document.getElementById(`phone-${id}`);
    
        //Assign data
            heroImgSrc = selectHeroImage(resultData.entityType);
            heroImage.setAttribute("src", `${heroImgSrc}`);
            heroImage.setAttribute("alt", `${resultData.entityType}`);
            heroName.innerHTML = resultData.name;
            heroAddress.innerHTML = resultData.Address.formattedAddress;
                saveLabel.innerHTML = "Save";
                saveIcon.setAttribute("onClick", `addSavedLocation(${id})`);
                saveIcnSrc = checkSaveStatus();
                saveIcon.setAttribute("src", saveIcnSrc);
                //saveIcon.setAttribute("alt","Save this location");
                directionLabel.innerHTML = "Est Time"
                directionIcon.setAttribute("onClick", `saveResult(${id})`);
                directionIcon.setAttribute("src","\images\\map-marker.svg")
                //directionIcon.setAttribute("alt","Recieve Directions for this location")
                websiteIcon.setAttribute("src","images\\browser.svg");
                websiteLink.setAttribute("href", `${resultData.Website}`);
                phoneIcon.innerHTML = `${resultData.PhoneNumber}`;
    
    }
//#endregion

//#region Pins
    //set pin @ location
        function pinPoint(location){
            var pin = new Microsoft.Maps.Pushpin(location)

            map.entities.push(pin);
        }
        function pinCoord(location){
            var latitude = location.point.coordinates[0];
            var longitude = location.point.coordinates[1];
            var point = new point(latitude,longitude);
            
            var pin = new Microsoft.Maps.Pushpin(point);
            map.entities.push(pin);
        }
    //set pin @ array of locations
        function pinLocations(locationArray){
            for (let i = 0; i < locationArray.length; i++){
                var latitude = locationArray[i].point.coordinates[0];
                var longitude = locationArray[i].point.coordinates[1];
                var currentPoint = new point(latitude,longitude);
                

                var pin = new Microsoft.Maps.Pushpin(currentPoint);
                map.entities.push(pin);
            }
        }
    //clear pins
    //save pins
    //remove single pin

//#endregion



//Returns file location bacsed off Location Entity Type (Shopping, Food, etc.)
function selectHeroImage(entityType){

    //might need to make all the elements sigular
    const eatDrink = ["Bars", "BarsGrillsAndPubs", "BelgianRestaurants", "BreweriesAndBrewPubs", "BritishRestaurants", "BuffetRestaurants", "CafeRestaurants","CaribbeanRestaurants","ChineseRestaurants","CocktailLounges","CoffeeAndTea","Delicatessens","DeliveryService","Diners","DiscountStores","Donuts","FastFood","FrenchRestaurants","FrozenYogurt","GermanRestaurants","GreekRestaurants","Grocers","Grocery","HawaiianRestaurants","HungarianRestaurants","IceCreamAndFrozenDesserts","IndianRestaurants","ItalianRestaurants","ItalianRestaurants","JapaneseRestaurants","Juices","KoreanRestaurants","LiqourStores","MexicanRestaurants","MiddleEasterRestaurants","Pizza","PolishRestaurants","PortugueseRestaurants","Pretzels","Restaurant","RussianAndUkrainianRestaurants","Sandwiches","SeafoodRestaurants","SportsBars","SteakHouseRestaurants","Supermarkets","SushiRestaurants","TakeAway","Taverns","ThaiRestaurants","TurkishRestaurants","VegetarianAndVeganRestaurants","VietnameseRestaurants"];
    const seeDo = ["AmusementParks", "Attractions", "Carnicals", "Casinos", "LandmarksAndHistoricalSites", "MiniatureGolfCourses", "MovieTheaters","Museums","Parks","SightseeingTours","TouristInformation","Zoos"];
    const shop = ["AntiqueStores", "Bookstores", "CDAndRecordStores", "ChildernsClothingStores", "CigarAndTobaccoShops", "ComicBookStores", "DepartmentStores", "DiscountStores","FleaMarketsAndBazaars","FurnitureStores","HomeImprovementStores","JewelryAndWatchesStores","KitchenwareStores","LiquorStores", "MallsAndShoppingCenters", "MensClothingStores", "MusicStores", "OutletStores", "PetShops", "PetSupplyStores", "SchoolAndOfficeSupplyStores","ShoeStores","SportingGoodStores", "ToyAndGameStores", "VitaminAndSupplementStores","WomensClothingStores"];
    if (entityType == "BanksAndCreditUnions") {
        return "\images\\bank.svg";
    }
    else if (entityType == "Hospitals") {
        return "\images\\doctor.svg";
    }
    else if (entityType == "HotelsAndMotels") {
        return "\images\\bed.svg";
    }
    else if (entityType == "Parking") {
        return "\images\\car-garage.svg";
    }
    else if (checkInArray(entityType, eatDrink)){
        return "\images\\restaurant.svg";
    }
    else if (checkInArray(entityType, seeDo)) {
        return "\images\\ferris-wheel.svg";
    }
    else if (checkInArray(entityType, shop)) {
        return "\images\\shopping-cart.svg";
    }
    else {
        return "\images\\globe.svg";
    }   
}

//made this to chase down a bug and ofc i spelt an element wrong in the array
function checkInArray(element, array){
    for (let index = 0; index < array.length; index++) {
        const currentElement = array[index];
        if (element == currentElement) {
            return true;
        }
    }
    return false;
}