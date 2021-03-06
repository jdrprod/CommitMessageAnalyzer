let getUrl = new URLSearchParams(window.location.search).get('url');
if (getUrl !== null)
    getCommit(getUrl);

function analyze() {
    getCommit(document.getElementById("url").value);
}

function increaseBrokenRule(brokenRules, name) {
    brokenRules[name] = (brokenRules[name] || 0) + 1;
}

function addName(mail, name) {
    if (!(mail in mailToName))
        mailToName[mail] = { [name]: 1};
    else
        mailToName[mail][name] = (mailToName[mail][name] || 0) + 1;
}

function drawChart()
{
    let array = new Array();
    array.push(new Array());
    array[0].push("Names");
    array[0].push("Errors");
    let i = 1;
    for (var key in brokenRules) {
        array.push(new Array());
        array[i].push(key);
        array[i].push(brokenRules[key]);
        i++;
    }
    let data = google.visualization.arrayToDataTable(array);
    let options = {
        title: "Error per members"
    };
    let chart = new google.visualization.PieChart(document.getElementById("errorChart"));
    chart.draw(data, options);
}

var intro = "<table><tr><th>Author</th><th>Commit</th><th>Result</th></tr>";
var result = "";
var brokenRules = {};
var mailToName = [];

function getCommit(url) {
    result = "";
    brokenRules = {};
    document.getElementById("result").innerHTML = "Loading, please wait...";
    var regex = /http[s]?:\/\/(github|gitlab).com\/([ 'a-zA-Z0-9_-]+)\/([ 'a-zA-Z0-9_-]+)/.exec(url);
    var website = regex[1];
    var author = regex[2];
    var repo = regex[3];
    var http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let tmpJson = JSON.parse(this.responseText);
            let json = tmpJson[0];
            json.forEach(function(elem) {
                addName(elem[2], elem[0]);
            });
            mailToName.forEach(function(elem) {
                elem.sort(function(a, b) {
                    if (a > b) return 1;
                    else return -1;
                })
            });
            json.forEach(function(elem) {
                var name = Object.keys(mailToName[elem[2]])[0];
                result += "<tr><td>" + name + '</td><td><a id="commitLink" href="' + elem[3] + '">' + elem[1] + '</a></td><td>';
                if (!elem[4][1]) {
                    result += '<a target="_blank" href="https://chris.beams.io/posts/git-commit/#limit-50">Rule 2</a> ';
                    increaseBrokenRule(brokenRules, name);
                }
                if (!elem[4][2]) {
                    result += '<a target="_blank" href="https://chris.beams.io/posts/git-commit/#capitalize">Rule 3</a> ';
                    increaseBrokenRule(brokenRules, name);
                }
                if (!elem[4][3]) {
                    result += '<a target="_blank" href="https://chris.beams.io/posts/git-commit/#end">Rule 4</a> ';
                    increaseBrokenRule(brokenRules, name);
                }
                if (!elem[4][4]) {
                    result += '<a target="_blank" href="https://chris.beams.io/posts/git-commit/#imperative">Rule 5</a> ';
                    increaseBrokenRule(brokenRules, name);
                }
                result = result.replace(new RegExp('\n', 'g'), '<br/>');
                result += "</td></tr>";
            });
            document.getElementById("result").innerHTML = '<div id="errorChart"></div>'
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart);
            if (!tmpJson[1])
                result += "<strong>Warning: Only the 500 firsts commits were analysed.</strong>";
            document.getElementById("result").innerHTML += "<br/>" + intro + result + "</table>";
        }
    };
    http.open("GET", "php/request.php?author=" + author + "&repo=" + repo + "&website=" + website, true);
    http.send();
}