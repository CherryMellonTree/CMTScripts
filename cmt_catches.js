

(function () {

// ty tsitu :)
// Step 1: get data from server
async function getCatchStats(){
    let cookiematerial = {};
    let data;
    const xhr = new XMLHttpRequest();
    xhr.open(
        "GET",
        `https://www.mousehuntgame.com/managers/ajax/mice/getstat.php?sn=Hitgrab&hg_is_ajax=1&action=get_hunting_stats&uh=${user.unique_hash}`);
    xhr.onload = function() {
        data = JSON.parse(xhr.responseText);
        for(let j in data.hunting_stats){
            console.log(data.hunting_stats[j]);
            cookiematerial[data.hunting_stats[j].name] = {'catches': data.hunting_stats[j].num_catches, 'thumb':data.hunting_stats[j].thumb }
        };
    }
    xhr.send();
    await new Promise(r => setTimeout(r, 1000));
    localStorage.setItem("CMT_catchstats", JSON.stringify(cookiematerial));
}


// Take cookie & filter
async function listMiceOfCurrentLocation(){
    let currentLocation = user.environment_type;
    let mice= [];
    const xhr = new XMLHttpRequest();
    xhr.open(
        "POST",
        `https://www.mousehuntgame.com/managers/ajax/mice/mouse_list.php?action=get_environment&category=${currentLocation}&user_id=${user.user_id}&display_mode=stats&view=ViewMouseListEnvironments&uh=${user.unique_hash}`,
        true
        );
    xhr.onload = function (){
        const response = JSON.parse(xhr.responseText);
        const stats = response.mouse_list_category.subgroups[0].mice;
        console.log(stats);
        if (!stats) {
            console.log(`no stats found for ${currentLocation}`);
        }else{
            stats.forEach(el => {mice.push(el.name);});

        }
    }
    xhr.send();
    await new Promise(r => setTimeout(r, 1000));
    let storedData = JSON.parse(localStorage.getItem("CMT_catchstats"));
    mice.forEach(el=>{
        console.log(storedData[el])
    }
)
}

function render(){
    const existing = document.querySelector("#cmt_crowns");
    if (existing){
        existing.remove();
    }

    const rawData = localStorage.getItem("CMT_catchstats");
    if(rawData){
        const data = JSON.parse(rawData);
    }

    // popup styling
    const mainDiv = document.createElement("div");
    mainDiv.id = "cmt_crowns"
    mainDiv.style.backgroundColor = "#F5F5F5";
    mainDiv.style.position = "fixed";
    mainDiv.style.zIndex = "42";
    mainDiv.style.left = "5px";
    mainDiv.style.top = "5px";
    mainDiv.style.border = "solid 3px #696969";
    mainDiv.style.borderRadius = "20px";
    mainDiv.style.padding = "10px";
    mainDiv.style.textAlign = "center";

    // Top div styling (close button, title, drag instructions)
    const topDiv = document.createElement("div");

    const titleSpan = document.createElement("span");
    titleSpan.style.fontWeight = "bold";
    titleSpan.style.fontSize = "18px";
    titleSpan.style.textDecoration = "underline";
    titleSpan.style.paddingLeft = "20px";
    titleSpan.innerText = "Catch Stats";
    const dragSpan = document.createElement("span");
    dragSpan.innerText = "(Drag title to reposition this popup)";

    const closeButton = document.createElement("button");
    closeButton.style.float = "right";
    closeButton.style.fontSize = "8px";
    closeButton.textContent = "x";
    closeButton.onclick = function () {
      document.body.removeChild(mainDiv);
    };

    topDiv.appendChild(closeButton);
    topDiv.appendChild(titleSpan);
    topDiv.appendChild(document.createElement("br"));
    topDiv.appendChild(dragSpan);
    

}

// Inject initial button/link into UI
function injectUI() {
    document.querySelectorAll("#crown_progress_button").forEach(el => el.remove());
    const target = document.querySelector(".mousehuntHud-gameInfo");
    if (target) {
    const link = document.createElement("a");
    link.id = "crown_progress_button";
    link.innerText = "[Crown progress]";
    link.addEventListener("click", function () {
        const existing = document.querySelector("#cmt_crowns");
        if (existing) existing.remove();
        else render();
        return false; // Prevent default link clicked behavior
    });
    target.prepend(link);
    }
}})();