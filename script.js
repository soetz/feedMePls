/* jshint esversion: 6 */

const feedPrefix = "https://crossorigin.me/";
feeds = ["http://radiofrance-podcast.net/podcast09/rss_14089.xml", "http://rss.cnn.com/services/podcasting/studentnews/rss.xml"];
channels = [];
mode = "channel-select";

window.addEventListener("load", function() {
  refreshFeeds();
});

function refreshFeeds() {
  var nbProcessed = 0;
  channels = [];

  feeds.forEach(function(feed) {
    const request = new XMLHttpRequest();
    const url = feedPrefix + feed;
    request.open("GET", url);

    request.onerror = function() {
      nbProcessed += 1;
      console.log("AN ERROR OCCURED WHILE FETCHING URL \"" + url + "\"");

      if(nbProcessed >= feeds.length){
        refreshView();
      }
    };

    request.onload = function() {
      nbProcessed += 1;

      if(request.status === 200){

        var rssXml = request.responseXML;

        //console.log(rssXml);

        var channelTitle = getTextContent(rssXml.querySelector("channel > title"));
        var channelDescription = getTextContent(rssXml.querySelector("channel > description"));
        var channelLink = getTextContent(rssXml.querySelector("channel > link"));
        var channelImage = getTextContent(rssXml.querySelector("channel > image > url"));

        var items = [];

        rssXml.querySelectorAll("item").forEach(function(item) {
          var itemTitle = getTextContent(item.querySelector("title"));
          var itemDescription = getTextContent(item.querySelector("description"));
          var itemLink = getTextContent(item.querySelector("link"));
          var itemEnclosure = item.querySelector("enclosure");

          var itemObject = {title: itemTitle, description: itemDescription, link: itemLink, enclosure: itemEnclosure, selected: false};

          items.push(itemObject);
        });

        var channelObject = {title: channelTitle, description: channelDescription, link: channelLink, image: channelImage, items: items, selected: false};

        channels.push(channelObject);
      }
      else {
        console.log("ERROR " + request.status);
      }

      if(nbProcessed >= feeds.length){
        /* the view is only refreshed once all feeds have been processed
        (we don't do it after request.send() because of its asynchronous nature - if you handle a large RSS feed
        there's a chance that the refresh begins before onload is fired) */
        refreshView();
      }
    };

    request.send();
  });
}

function addFeed(feed) {
  feeds.push(feed);
  refreshFeeds();
}

function setChannelSelectMode(){
  document.querySelector("body").setAttribute("class", "channel-select-mode");
}

function setVideoMode(){
  document.querySelector("body").setAttribute("class", "video-mode");
}

function refreshView(){
  var channelSelectPanel = document.getElementById("channel-select");
  while (channelSelectPanel.firstChild) {
      channelSelectPanel.removeChild(channelSelectPanel.firstChild);
  }

  channels.forEach(function(channel) {
    var container = document.createElement("div");
    container.setAttribute("class", "channel-container");
    var title = document.createElement("a");
    title.setAttribute("class", "channel-title");
    title.textContent = channel.title;
    var content = document.createElement("div");
    content.setAttribute("class", "channel-content");
    var link = document.createElement("a");
    link.setAttribute("class", "channel-link");
    link.setAttribute("href", channel.link);
    var linkIcon = document.createElement("img");
    linkIcon.setAttribute("class", "channel-link-icon");
    linkIcon.setAttribute("src", "assets/ic_public_white_48px.svg");
    var description = document.createElement("div");
    description.setAttribute("class", "channel-description");
    description.textContent = channel.description;
    content.appendChild(link);
    link.appendChild(linkIcon);
    content.appendChild(description);
    container.appendChild(title);
    container.appendChild(content);

    title.addEventListener("click", function() {
      if(!container.classList.contains("selected")) {
        if(container.parentNode.querySelector(".selected") !== null) {
          container.parentNode.querySelector(".selected").classList.remove("selected");
        }

        container.className += " selected";
      }
      else {
        container.classList.remove("selected");
      }
    });

    channelSelectPanel.appendChild(container);
  });
}

function getTextContent(object) {
  if(object !== null) {
    return(object.textContent);
  }
  else {
    return(null);
  }
}
