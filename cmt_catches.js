

(function () {

// ty tsitu :)
// Step 1: get user catch data from server
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


// Take cookie & filter to only have location mice left
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
        if (!stats) {
            console.log(`no stats found for ${currentLocation}`);
        }else{
            stats.forEach(el => {console.log(el);mice.push(el.name);});
        }
    }
    xhr.send();
    await new Promise(r => setTimeout(r, 1000));
    let storedData = JSON.parse(localStorage.getItem("CMT_catchstats"));
    listOfMiceWithData = {};
    mice.forEach(el=>{
        if (storedData[el]){
            listOfMiceWithData[el] = (storedData[el])}
        else{listOfMiceWithData[el] = (storedData[el + ' Mouse'])}
        }
    )
    return listOfMiceWithData;
}

//TODO: add the needed link to the top to open the modal
async function addLinkToUI (){
    await getCatchStats();
    const target = document.querySelector(".mousehuntHud-gameInfo");
    const link = document.createElement("a");
    link.innerText = "[Mice caught]";
    link.addEventListener("click", function () {
      const existing = document.querySelector("#cmt_micecaught_modal");
      if (existing) existing.remove();
      else uponButtonClick();
    });
    target.prepend(link);
}
function createGenericTopDiv(parent, title){
    // Top div styling (close button, title, drag instructions)
    const topDiv = document.createElement("div");

    const titleSpan = document.createElement("span");
    titleSpan.style.fontWeight = "bold";
    titleSpan.style.fontSize = "18px";
    titleSpan.style.textDecoration = "underline";
    titleSpan.style.paddingLeft = "20px";
    titleSpan.innerText = title;
    const dragSpan = document.createElement("span");
    dragSpan.innerText = "(Drag title to reposition this popup)";

    const closeButton = document.createElement("button");
    closeButton.style.float = "right";
    closeButton.style.fontSize = "8px";
    closeButton.textContent = "x";
    closeButton.onclick = function () {
      document.body.removeChild(parent);
    };

    topDiv.appendChild(closeButton);
    topDiv.appendChild(titleSpan);
    topDiv.appendChild(document.createElement("br"));
    topDiv.appendChild(dragSpan);
    return topDiv
}

//TODO: create the modal and do all the other smart stuffs
async function uponButtonClick(){
    const existing = document.querySelector("#cmt_micecaught_modal");
    if (existing) existing.remove();
   
    // kindly repurposed UI elements provided by Tsitu
    const mainDiv = document.createElement("div");
    mainDiv.id = "cmt_micecaught_modal";
    mainDiv.style.backgroundColor = "#F5F5F5";
    mainDiv.style.position = "fixed";
    mainDiv.style.zIndex = "42";
    mainDiv.style.left = "5px";
    mainDiv.style.top = "5px";
    mainDiv.style.border = "solid 3px #696969";
    mainDiv.style.borderRadius = "20px";
    mainDiv.style.padding = "10px";
    mainDiv.style.textAlign = "center";
    
    // Create generic top div
    const topDiv = createGenericTopDiv(mainDiv, "Area Catch Stats");
    
    // Create less generic table with mouse stuffs in it
    const mouseTableDiv = document.createElement("div");
    mouseTableDiv.style.overflowY = "scroll";
    mouseTableDiv.style.height = "50vh";
    const mouseTable = document.createElement("table");
    const mouseTableBody = document.createElement("tbody");

    // fill the table I think and also fetch the data to fill the table I think?
    const mouseList = await listMiceOfCurrentLocation();
    const micenames = Object.keys(mouseList);
    //TODO: create the stuff for *in* a row
    micenames.forEach(el=>{
        //create row fields to add to row
        const nameField = document.createElement("td");
        const nameSpan = document.createElement("span");
        nameSpan.className = "cmt-catch-stats-namespan";
        nameSpan.style.fontSize = "14px";
        nameSpan.textContent = el;
        const catchesField = document.createElement("td");
        const catchesSpan = document.createElement("span");
        catchesSpan.className = "cmt-catch-stats-catchspan";
        catchesSpan.style.fontSize = "14px";
        catchesSpan.textContent = mouseList[el]['catches'];
        catchesField.appendChild(catchesSpan);
        //add stuffs to row
        const mouseRow = document.createElement("tr");
        mouseRow.className = "cmt-catches-row";
        nameField.appendChild(nameSpan);
        mouseRow.appendChild(nameField);
        mouseRow.appendChild(catchesField);
        //add row to table
        mouseTableBody.appendChild(mouseRow);
    })
    //TODO: Create actual window that opens, with:
    // - a :) title
    // - a nice listing of the data received from listMiceOfCurrentLocation()
    // - a button to refresh data?
    // - potential war crimes

    mouseTable.appendChild(mouseTableBody);
    mouseTableDiv.appendChild(mouseTable);

    mainDiv.appendChild(topDiv);
    mainDiv.appendChild(document.createElement("br"));
    mainDiv.appendChild(mouseTableDiv)
    document.body.appendChild(mainDiv)

}

addLinkToUI();
})();