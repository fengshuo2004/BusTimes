class Bus {
    operator = "";
    route = "";
    destination = "";
    dueIn = 0;
    color = "";

    /**
     * Object representing a tracked bus service
     * @param {String} op - single-char bus operator id
     * @param {String} route - bus route, like "60A"
     * @param {String} dest - destination
     * @param {Number} due - number of minutes til due 
     * @param {String} color - color of the badge, pass null for default
     */
    constructor(op, route, dest, due, color) {
        this.operator = op;
        this.route = route;
        this.destination = dest;
        this.dueIn = due;
        this.color = color;
    }
}

/**
 * Wraps around an array of Bus objects, offering methods to modify it
 */
class Board {

    board = [];

    /**
     * Add a Bus object and keep the array sorted by due time
     * @param {Bus} record 
     */
    add(record) {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i].dueIn > record.dueIn) {
                this.board.splice(i, 0, record);
                return;
            }
        }
        this.board.push(record);
    }

    /**
     * Flush the current state of the array to screen
     */
    update() {
        let iconElements = document.querySelectorAll(".icon");
        let routeElements = document.querySelectorAll(".route");
        let destElements = document.querySelectorAll(".destination");
        let dueElements = document.querySelectorAll(".live");
        for (let i = 0; i < Math.min(routeElements.length, this.board.length); i++) {
            iconElements[i].src = `resources/${this.board[i].operator}.png`;
            routeElements[i].innerText = this.board[i].route;
            if (this.board[i].route.length > 3) { // long numbers eg. "X10A" condensed to make space
                routeElements[i].style.fontStretch = "condensed";
            } else {
                routeElements[i].style.fontStretch = "normal";
            }
            iconElements[i].parentNode.style.backgroundColor = this.board[i].color;
            destElements[i].innerText = this.board[i].destination;
            dueElements[i].innerText = (this.board[i].dueIn ? `${this.board[i].dueIn} mins` : "now");
        }
    }

    /**
     * Clears the array
     */
    clear() {
        this.board = [];
    }

    /**
     * Parse JSON response from the First Bus API
     * @param {Object} data - API response as a JSON object
     */
    parseFirstBus(data) {
        for (const i of data["times"]) {
            if (i["IsLive"] == "Y") {
                let route = i["ServiceNumber"];
                let destination = i["Destination"];
                let dueTime;
                if (i["Due"] == "Due now") {
                    dueTime = 0;
                } else {
                    dueTime = Number(i["Due"].split(" ")[0]); // eg. "15 mins" => 15
                }
                console.log(`DEBUG: ${route} to ${destination} in ${dueTime} mins`);
                this.add(new Bus("F", route, destination, dueTime, firstRouteColor(route)));
            }
        }
    }

    /**
     * Parse HTML response from the API of West Coast Motors / McGill's
     * @param {String} data - API response in plain text
     * @param {String} operator - single-char bus operator id to be passed to add()
     */
    parseWebBasedBus(data, operator) {
        let doc = new DOMParser().parseFromString(data, "text/html");
        let list = doc.querySelectorAll(".departure-board__item");
        for (const i of list) {
            if (i.querySelector(".real-time-animation")) { // if it's live time
                let route = i.querySelector(".single-visit__name").innerText;
                let destination = i.querySelector(".single-visit__description").innerText;
                let dueTimeStr = i.querySelector(".single-visit__time--expected").innerText;
                let dueTime;
                let color = i.querySelector(".single-visit__highlight").style.backgroundColor;
                if (dueTimeStr == "Due") {
                    dueTime = 0;
                } else if (dueTimeStr.includes(":")) { // eg. "11:45" TODO: calculate time delta
                    continue;
                } else {
                    dueTime = Number(dueTimeStr.split(" ")[0]); // eg. "15 mins" => 15
                }
                console.log(`DEBUG: ${route} to ${destination} in ${dueTime} mins`);
                this.add(new Bus(operator, route, destination, dueTime, color));
            }
        }
    }
}

/**
 * Search for a bus stop based on its name or ATCO code
 * @param {String} query - name of bus stop to search for
 * @returns {Array} search results
 */
async function findStop(query) {
    let url = "/www.spt.co.uk/api/traveline/getstops?searchterm=" + encodeURIComponent(query);
    const response = await fetch(url);
    if (response.ok) {
        let stops = [];
        const data = await response.json();
        for (const i of data["locations"]) {
            if (i["category"] == "busStop") {
                stops.push({ "name": i["fullname"], "atco": parseInt(i["stopID"]) });
            }
        }
        return stops;
    } else {
        throw new Error(`Request returned status code ${response.status}`);
    }
}

/**
 * Look up and return the color of the given First Bus route
 * @param {String} route - route number of the service
 * @returns {String} hex color of the route
 */
function firstRouteColor(route) {
    let colors = {
        "1": "#75246c", "1A": "#75246c", "1B": "#75246c", "1C": "#75246c", "1D": "#75246c", "1E": "#75246c", "X4": "#75246c",
        "2": "#60bb46",
        "3": "#a67435",
        "4": "#de761b", "4A": "#de761b",
        "5": "#f9a86f",
        "6": "#f9a51b",
        "6A": "#f36e21",
        "7": "#00a54f", "7A": "#00a54f",
        "9": "#ed027c", "9A": "#ed027c",
        "10": "#ef59a1",
        "18": "#d0202f",
        "34": "#049590",
        "38": "#5cc3b2", "38A": "#5cc3b2", "38B": "#5cc3b2", "38C": "#5cc3b2", "38E": "#5cc3b2",
        "41": "#ffdc01",
        "57": "#0d4da1", "57A": "#0d4da1",
        "60": "#8dd7f7", "60A": "#8dd7f7",
        "61": "#57c4e3",
        "75": "#f0e85a",
        "77": "#0072bc",
        "87": "#c30162", "88": "#c30162",
        "89": "#c82434", "89A": "#c82434", "89B": "#c82434",
        "201": "#75246c",
        "240": "#00aeef",
        "267": "#cf9b2a",
        "500": "#92348e",
        "X3": "#ab9a6b", "X11": "#ab9a6b", "X85": "#ab9a6b", "X87": "#ab9a6b"
    };
    return colors[route] ? colors[route] : "#0c376e";
}