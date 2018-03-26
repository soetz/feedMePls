/* jshint esversion: 6 */

const feedPrefix = "https://crossorigin.me/";
feeds = ["http://radiofrance-podcast.net/podcast09/rss_14089.xml", "http://rss.cnn.com/services/podcasting/studentnews/rss.xml"];
channels = [];
mode = "channel-select";
nowPlaying = null;

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

  document.getElementById("add-channel-field").addEventListener("keyup", function(event) {
    event.preventDefault();
    if(event.keyCode === 13) {
      var feedUrl = document.getElementById("add-channel-field").value;
      if(feedUrl !== ""){
        addFeed(feedUrl);
      }
      document.getElementById("add-channel-field").value = "";
    }
  });

  document.getElementById("progress-bar").value = 0;
  document.getElementById("progress-bar").addEventListener("change", function(){
    console.log(document.getElementById("progress-bar").value);
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
          updateView();
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
            var itemDate = getTextContent(item.querySelector("pubDate"));
            var itemEnclosure = item.querySelector("enclosure");
            var itemMediaUrl = itemEnclosure.getAttribute("url");
            var itemMediaType = null;
            if(itemEnclosure.getAttribute("type") === "audio/mpeg") {
              itemMediaType = "audio";
            }
            else if (itemEnclosure.getAttribute("type") === "video/mp4") {
              itemMediaType = "video";
            }

            var itemObject = {title: itemTitle, description: itemDescription, link: itemLink, mediaUrl: itemMediaUrl, mediaType: itemMediaType, selected: false};

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
          updateView();
        }
      };

      request.send();
    });
  }
  else {
    updateView();
  }
}

function addFeed(feed) {
  if(!feeds.includes(feed)) {
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

function updateView(){
  var channelSelectPanel = document.getElementById("channel-select");
  removeAllChildren(channelSelectPanel);

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
    link.setAttribute("target", "_blank");
    var linkIcon = document.createElement("img");
    linkIcon.setAttribute("class", "channel-link-icon");
    linkIcon.setAttribute("src", "assets/ic_public_white_48px.svg");
    linkIcon.setAttribute("alt", "Link to the feed source");
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
      toggleSelected(container, channel);
      updatePodcasts();
    });

    channelSelectPanel.appendChild(container);
  });
}

function updatePodcasts() {
  var podcastSelectPanel = document.getElementById("podcast-select");
  removeAllChildren(podcastSelectPanel);

  channels.forEach(function(channel) {
    if(channel.selected) {
      channel.items.forEach(function(item) {
        var container = document.createElement("div");
        container.setAttribute("class", "podcast-container");
        var podcastWrapper = document.createElement("a");
        podcastWrapper.setAttribute("class", "podcast-wrapper");
        var title = document.createElement("span");
        title.setAttribute("class", "podcast-title");
        title.textContent = item.title;
        var description = document.createElement("span");
        description.setAttribute("class", "podcast-description");
        description.textContent = " ||| " + item.description;

        podcastWrapper.appendChild(title);
        podcastWrapper.appendChild(description);
        container.appendChild(podcastWrapper);

        container.addEventListener("click", function() {
          if(toggleSelected(container, item)) {
            //TODO play
          }
        });

        podcastSelectPanel.appendChild(container);
      });

      if(channel.image === null){
        document.getElementById("player-image").setAttribute("src", "assets/ic_image_white_48px.svg");
      }
      else {
        document.getElementById("player-image").setAttribute("src", channel.image);
      }
    }
  });
}

function removeAllChildren(node) {
  while(node.hasChildNodes()){
    node.removeChild(node.firstChild);
  }
}

function toggleSelected(domObject, object) {
  var t;
  if(channels.includes(object)) {
    t = "channel";
  }
  else {
    t = "item";
  }

  if(!domObject.classList.contains("selected")) {
    if(domObject.parentNode !== null) {
      if(domObject.parentNode.querySelector(".selected") !== null) {
        domObject.parentNode.querySelector(".selected").classList.remove("selected");
      }
    }

    if(t === "channel") {
      channels.forEach(function(channel) {
        channel.selected = false;
      });
    }
    else if(t === "item") {
      channels.forEach(function(channel) {
        channel.items.forEach(function(item) {
          item.selected = false;
        });
      });
    }

    domObject.className += " selected";
    object.selected = true;
    if(t === "item"){
      play(object);
    }
    return(true);
  }
  else {
    domObject.classList.remove("selected");
    object.selected = false;
    nowPlaying = null;
    return(false);
  }
}

function play(podcast) {
  removeCurrentMedia();
  var focusTitle = document.getElementById("player-content-focus-title");
  var focusDescription = document.getElementById("player-content-focus-description");
  var articleLink = document.getElementById("article-button-wrapper");
  focusTitle.textContent = "";
  focusDescription.textContent = "";
  articleLink.removeAttribute("href");

  focusTitle.textContent = podcast.title;
  focusDescription.textContent = podcast.description;
  articleLink.setAttribute("href", podcast.link);
  nowPlaying = podcast;
  if(podcast.mediaType === "audio"){
    addAudio(podcast);
  }
  else if(podcast.mediaType === "video"){
    addVideo(podcast);
  }
}

function removeCurrentMedia() {
  removeAllChildren(document.getElementById("audio-container"));
  removeAllChildren(document.getElementById("video-play"));
}

function addAudio(podcast) {
  var container = document.getElementById("audio-container");
  var audio = document.createElement("audio");
  audio.setAttribute("id", "audio-media");
  var source = document.createElement("source");
  source.setAttribute("src", podcast.mediaUrl);

  audio.appendChild(source);
  container.appendChild(audio);

  var playPromise = audio.play();
  if(playPromise !== undefined){
    playPromise.then(_ => {
      totalDuration(audio.duration);
      actualDuration();
    })
    .catch(error => {
      //pause UI
    });

    audio.addEventListener("timeupdate", function() {
      actualDuration();
    });
  }
}

function addVideo(podcast) {

}

function totalDuration(duration) {
  var sec = duration % 60;
  var min = (duration - sec) / 60;
  var extraZero = "";
  if(sec < 10){
    extraZero = "0";
  }
  document.getElementById("total-time").textContent = min + ":" + extraZero + Math.floor(sec);
}

function actualDuration() {
  if(nowPlaying.mediaType === "audio"){
    var time = document.getElementById("audio-media").currentTime;
    var sec = time % 60;
    var min = (time - sec) / 60;
    var extraZero = "";
    if(sec < 10){
      extraZero = "0";
    }
    document.getElementById("current-time").textContent = min + ":" + extraZero + Math.floor(sec);

    document.getElementById("progress-bar").value = time / document.getElementById("audio-media").duration;
  }
}

function getTextContent(object) {
  if(object !== null) {
    return(object.textContent);
  }
  else {
    return(null);
  }
}
