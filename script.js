/* jshint esversion: 6 */

const feedPrefix = "https://crossorigin.me/";
feeds = ["http://radiofrance-podcast.net/podcast09/rss_14089.xml", "http://rss.cnn.com/services/podcasting/studentnews/rss.xml"];
channels = [];

window.addEventListener("load", function() {
  refreshFeeds();
});

function refreshFeeds() {
  feeds.forEach(function(feed) {
    const request = new XMLHttpRequest();
    const url = feedPrefix + feed;
    request.open("GET", url);

    request.onerror = function() {
      console.log("AN ERROR OCCURED WHILE FETCHING URL \"" + url + "\"");
    };

    request.onload = function() {
      if(request.status === 200){
        channels = [];

        var rssXml = request.responseXML;

        //console.log(rssXml);

        var channelTitle = rssXml.querySelector("channel > title").textContent;
        var channelDescription = rssXml.querySelector("channel > description").textContent;
        var channelLink = rssXml.querySelector("channel > link").textContent;
        var channelImage = rssXml.querySelector("channel > image > url").textContent;

        var items = [];

        rssXml.querySelectorAll("item").forEach(function(item) {
          var itemTitle = item.querySelector("title").textContent;
          var itemDescription = item.querySelector("description").textContent;
          var itemLink = item.querySelector("link").textContent;
          var itemEnclosure = item.querySelector("enclosure");

          var itemObject = {title: itemTitle, description: itemDescription, link: itemLink, enclosure: itemEnclosure};

          items.push(itemObject);
        });

        var channelObject = {title: channelTitle, description: channelDescription, link: channelLink, image: channelImage, items: items};

        channels.push(channelObject);

        console.log(channels);
      }
      else {
        console.log("ERROR " + request.status);
      }
    };

    request.send();
  });
}

function addFeed(feed) {
  feeds.push(feed);
  refreshFeeds();
}
