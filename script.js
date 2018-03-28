/* jshint esversion: 6 */

const feedPrefix = "https://crossorigin.me/";
feeds = [];
channels = [];
mode = "channel-select";
nowPlaying = null;
isPlaying = false;

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
    if(nowPlaying.mediaType === "audio"){
      document.getElementById("audio-media").currentTime = document.getElementById("audio-media").duration * document.getElementById("progress-bar").value;
    }
    else {
      document.getElementById("visual").currentTime = document.getElementById("visual").duration * document.getElementById("progress-bar").value;
    }
  });

  document.getElementById("playpause-button-wrapper").addEventListener("click", function() {
    if(nowPlaying !== null){
      setPlaying(!isPlaying);
    }
  });

  document.getElementById("replay10-button-wrapper").addEventListener("click", function() {
    if(nowPlaying !== null){
      var media;
      if(nowPlaying.mediaType === "audio"){
        media = document.getElementById("audio-media");
      }
      else {
        media = document.getElementById("visual");
      }

      if(media.currentTime - 10 > 0){
        media.currentTime = media.currentTime - 10;
      }
      else {
        media.currentTime = 0;
      }
    }
  });

  document.getElementById("forward10-button-wrapper").addEventListener("click", function() {
    if(nowPlaying !== null){
      var media;
      if(nowPlaying.mediaType === "audio"){
        media = document.getElementById("audio-media");
      }
      else {
        media = document.getElementById("visual");
      }

      if(media.currentTime + 10 < media.duration){
        media.currentTime = media.currentTime + 10;
      }
    }
  });

  document.getElementById("previous-button-wrapper").addEventListener("click", function() {
    if(nowPlaying !== null){
      var media;
      if(nowPlaying.mediaType === "audio"){
        media = document.getElementById("audio-media");
      }
      else {
        media = document.getElementById("visual");
      }

      if(media.currentTime < 5){
        playPrevious();
      }
      else {
        media.currentTime = 0;
      }
    }
  });

  document.getElementById("next-button-wrapper").addEventListener("click", function() {
    playNext();
  });

  document.getElementById("fullscreen-button-wrapper").addEventListener("click", function() {
    if(mode === "channel-select"){
      setVideoMode();
    }
    else {
      setChannelSelectMode();
    }
  });

  document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if(event.keyCode === 32){
      if(nowPlaying !== null){
        setPlaying(!isPlaying);
      }
    }
  });

  document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if(event.keyCode === 37){
      if(nowPlaying !== null){
        var media;
        if(nowPlaying.mediaType === "audio"){
          media = document.getElementById("audio-media");
        }
        else {
          media = document.getElementById("visual");
        }

        if(media.currentTime - 5 > 0){
          media.currentTime = media.currentTime - 5;
        }
        else {
          media.currentTime = 0;
        }
      }
    }
  });

  document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if(event.keyCode === 39){
      if(nowPlaying !== null){
        var media;
        if(nowPlaying.mediaType === "audio"){
          media = document.getElementById("audio-media");
        }
        else {
          media = document.getElementById("visual");
        }

        if(media.currentTime + 5 < media.duration){
          media.currentTime = media.currentTime + 5;
        }
      }
    }
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
            var itemMediaUrl = null;
            var itemMediaType = null;
            if(itemEnclosure !== null){
              itemMediaUrl = itemEnclosure.getAttribute("url");
              itemMediaType = null;
              if(itemEnclosure.getAttribute("type").includes("audio")) {
                itemMediaType = "audio";
              }
              else if (itemEnclosure.getAttribute("type").includes("video")) {
                itemMediaType = "video";
              }
            }

            var itemObject = {title: itemTitle, description: itemDescription, link: itemLink, mediaUrl: itemMediaUrl, mediaType: itemMediaType, representation: null, selected: false};

            items.push(itemObject);
          });

          var channelObject = {feed: feed, title: channelTitle, description: channelDescription, link: channelLink, image: channelImage, items: items, selected: false};

          if(channelObject.title !== null){
            channels.push(channelObject);
          }
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
  var paused = true;
  var video = document.getElementById("visual");
  if(video.tagName !== "IMG" && !video.paused && !video.ended){
    paused = false;
  }
  mode = "channel-select";
  document.querySelector("body").setAttribute("class", "channel-select-mode");
  var visual = document.getElementById("visual-wrapper");
  visual.remove();
  var panel = document.getElementById("player-panel");
  panel.insertBefore(visual, panel.firstChild);
  document.getElementById("fullscreen-button-icon").setAttribute("src", "assets/ic_fullscreen_white_48px.svg");
  if(nowPlaying !== null && nowPlaying.mediaType === "video" && !paused){
    setTimeout(function() {setPlaying(true);}, 100);
  }
}

function setVideoMode(){
  var paused = true;
  var video = document.getElementById("visual");
  if(video.tagName !== "IMG" && !video.paused && !video.ended){
    paused = false;
  }
  mode = "video";
  document.querySelector("body").setAttribute("class", "video-mode");
  var visual = document.getElementById("visual-wrapper");
  visual.remove();
  document.getElementById("fullscreen-wrapper").appendChild(visual);
  document.getElementById("fullscreen-button-icon").setAttribute("src", "assets/ic_fullscreen_exit_white_48px.svg");
  if(nowPlaying !== null && nowPlaying.mediaType === "video" && !paused){
    setTimeout(function() {setPlaying(true);}, 100);
  }
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
    closeIcon.setAttribute("alt", "Close the feed");
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
        if(item.selected){
          container.setAttribute("class", "podcast-container selected");
        }
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

        item.representation = container;

        container.addEventListener("click", function() {
          toggleSelected(container, item);
          if(item.mediaType === "video"){
            setVideoMode();
          }
        });

        podcastSelectPanel.appendChild(container);
      });

      if(nowPlaying !== null){
        if(nowPlaying.mediaType === "audio"){
          var visualWrapper = document.getElementById("visual-wrapper");
          removeAllChildren(visualWrapper);

          var imageCenter = document.createElement("div");
          imageCenter.setAttribute("id", "visual-center");
          var image = document.createElement("img");
          image.setAttribute("id", "visual");
          image.setAttribute("alt", "Feed image");
          imageCenter.appendChild(image);

          if(channel.image === null){
            image.setAttribute("src", "assets/ic_image_white_48px.svg");
          }
          else {
            image.setAttribute("src", channel.image);
          }

          visualWrapper.appendChild(imageCenter);
        }
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
    if(t === "item"){
      stop();
    }
    return(false);
  }
}

function play(podcast) {
  removeCurrentMedia();
  document.getElementById("progress-bar").value = 0;
  document.getElementById("current-time").textContent = "0:00";
  document.getElementById("total-time").textContent = "0:00";
  var focusTitle = document.getElementById("player-content-focus-title");
  var focusDescription = document.getElementById("player-content-focus-description");
  var articleLink = document.getElementById("article-button-wrapper");
  focusTitle.textContent = "";
  focusDescription.innerHTML = "";
  articleLink.removeAttribute("href");

  focusTitle.textContent = podcast.title;
  focusDescription.innerHTML = podcast.description;
  articleLink.setAttribute("href", podcast.link);
  nowPlaying = podcast;
  if(podcast.mediaType === "audio"){
    addAudio(podcast);
  }
  else if(podcast.mediaType === "video"){
    addVideo(podcast);
  }
}

function stop() {
  setPlaying(false);
  nowPlaying = null;
  removeCurrentMedia();
  var focusTitle = document.getElementById("player-content-focus-title");
  var focusDescription = document.getElementById("player-content-focus-description");
  var articleLink = document.getElementById("article-button-wrapper");
  focusTitle.textContent = "";
  focusDescription.innerHTML = "";
  articleLink.removeAttribute("href");
  document.getElementById("progress-bar").value = 0;
  document.getElementById("current-time").textContent = "0:00";
  document.getElementById("total-time").textContent = "0:00";
}

function playPrevious() {
  if(nowPlaying !== null){
    channels.forEach(function(channel) {
      if(channel.selected){
        var index = channel.items.indexOf(nowPlaying);
        if(index > 0){
          var item = channel.items[index - 1];
          toggleSelected(item.representation, item);
        }
      }
    });
  }
}

function playNext() {
  if(nowPlaying !== null){
    channels.forEach(function(channel) {
      if(channel.selected){
        var index = channel.items.indexOf(nowPlaying);
        if(index < channel.items.length - 1){
          var item = channel.items[index + 1];
          toggleSelected(item.representation, item);
        }
        else {
          setPlaying(false);
        }
      }
    });
  }
}

function removeCurrentMedia() {
  if(document.getElementById("audio-container") !== null){
    document.getElementById("audio-container").remove();
  }
  if(document.getElementById("video-container") !== null){
    document.getElementById("video-container").remove();
  }

  channels.forEach(function(channel) {
    if(channel.selected) {
      var visualWrapper = document.getElementById("visual-wrapper");
      removeAllChildren(visualWrapper);
      var visualCenter = document.createElement("div");
      visualCenter.setAttribute("id", "visual-center");
      var image = document.createElement("img");
      image.setAttribute("id", "visual");
      image.setAttribute("alt", "Feed image");
      visualCenter.appendChild(image);

      if(channel.image === null){
        image.setAttribute("src", "assets/ic_image_white_48px.svg");
      }
      else {
        image.setAttribute("src", channel.image);
      }

      visualWrapper.appendChild(visualCenter);
    }
  });
}

function addAudio(podcast) {
  var container = document.getElementById("audio-container");
  if(container === null){
    container = document.createElement("div");
    container.setAttribute("id", "audio-container");
    var body = document.getElementsByTagName("body")[0];
    body.insertBefore(container, body.firstChild);
  }
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
      setPlaying(true);
    })
    .catch(error => {
      setPlaying(false);
    });

    audio.addEventListener("timeupdate", function() {
      actualDuration();
    });

    audio.addEventListener("ended", function() {
      playNext();
    });
  }
}

function addVideo(podcast) {
  var media = document.getElementById("visual");
  if(media.tagName === "IMG"){
    document.getElementById("visual").remove();
    media = document.createElement("video");
    media.setAttribute("id", "visual");
    removeAllChildren(document.getElementById("visual-center"));
    document.getElementById("visual-center").appendChild(media);
  }
  media.setAttribute("src", podcast.mediaUrl);

  var playPromise = media.play();
  if(playPromise !== undefined){
    playPromise.then(_ => {
      totalDuration(media.duration);
      actualDuration();
      setPlaying(true);
    })
    .catch(error => {
      setPlaying(false);
    });

    media.addEventListener("timeupdate", function() {
      actualDuration();
    });

    media.addEventListener("ended", function() {
      playNext();
    });
  }
}

function setPlaying(playing) {
  if(playing){
    isPlaying = true;
    document.getElementById("playpause-button-icon").setAttribute("src", "assets/ic_pause_circle_outline_white_48px.svg");
    if(nowPlaying.mediaType === "audio"){
      document.getElementById("audio-media").play();
    }
    else {
      document.getElementById("visual").play();
    }
  }
  else {
    isPlaying = false;
    document.getElementById("playpause-button-icon").setAttribute("src", "assets/ic_play_circle_outline_white_48px.svg");
    if(nowPlaying !== null && nowPlaying.mediaType === "audio"){
      document.getElementById("audio-media").pause();
    }
    else if(nowPlaying !== null){
      document.getElementById("visual").pause();
    }
  }
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
  var media;
  if(nowPlaying !== null){
    if(nowPlaying.mediaType === "audio"){
      media = document.getElementById("audio-media");
    }
    else {
      media = document.getElementById("visual");
    }

    var time = media.currentTime;
    var sec = time % 60;
    var min = (time - sec) / 60;
    var extraZero = "";
    if(sec < 10){
      extraZero = "0";
    }

    document.getElementById("current-time").textContent = min + ":" + extraZero + Math.floor(sec);

    document.getElementById("progress-bar").value = time / media.duration;
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
