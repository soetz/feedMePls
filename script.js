/* jshint esversion: 6 */

const feedPrefix = "https://crossorigin.me/";
feeds = ["http://radiofrance-podcast.net/podcast09/rss_14089.xml", "http://rss.cnn.com/services/podcasting/studentnews/rss.xml"];
channels = [];
mode = "channel-select";

window.addEventListener("load", function() {
  document.getElementById("refresh-button-wrapper").addEventListener("click", function() {
    refreshFeeds();
  });

  document.getElementById("add-button-wrapper").addEventListener("click", function() {
    var feedUrl = document.getElementById("add-channel-field").value;
    if(feedUrl !== ""){
      addFeed(feedUrl);
    }
    document.getElementById("add-channel-field").value = "";
  });
});

function refreshFeeds() {
  var nbProcessed = 0;
  channels = [];

  if(feeds.length !== 0) {
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

          if(rssXml === null) {
            if(window.DOMParser) {
              parser = new DOMParser();
              rssXml = parser.parseFromString(request.responseText, "text/xml");
            }
          }
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

          var channelObject = {feed: feed, title: channelTitle, description: channelDescription, link: channelLink, image: channelImage, items: items, selected: false};

          //console.log(channelObject);
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
  else {
    refreshView();
  }
}

function addFeed(feed) {
  if(!feeds.contains(feed)) {
    feeds.push(feed);
    refreshFeeds();
  }
}

function removeFeed(feed) {
  if(feeds.length === 1 && feed[0] === feed) {
    feeds = [];
  }
  else {
    for(var i = feeds.length - 1; i >= 0; i--) {
      if(feeds[i] === feed) {
        feeds.splice(i, 1);
      }
    }
  }
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
  while (channelSelectPanel.hasChildNodes()) {
      channelSelectPanel.removeChild(channelSelectPanel.firstChild);
  }

  channels.forEach(function(channel) {
    var container = document.createElement("div");
    container.setAttribute("class", "channel-container");
    var titleWrapper = document.createElement("div");
    titleWrapper.setAttribute("class", "channel-title-wrapper");
    var title = document.createElement("div");
    title.setAttribute("class", "channel-title");
    title.textContent = channel.title;
    var closeWrapper = document.createElement("a");
    closeWrapper.setAttribute("class", "channel-close-wrapper");
    var closeIcon = document.createElement("img");
    closeIcon.setAttribute("class", "channel-close-icon");
    closeIcon.setAttribute("src", "assets/ic_close_white_48px.svg");
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
    titleWrapper.appendChild(title);
    closeWrapper.appendChild(closeIcon);
    titleWrapper.appendChild(closeWrapper);
    container.appendChild(titleWrapper);
    container.appendChild(content);

    closeWrapper.addEventListener("click", function() {
      removeFeed(channel.feed);
    });

    titleWrapper.addEventListener("click", function() {
      if(!container.classList.contains("selected")) {
        if(container.parentNode !== null){
          if(container.parentNode.querySelector(".selected") !== null) {
            container.parentNode.querySelector(".selected").classList.remove("selected");
          }
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
