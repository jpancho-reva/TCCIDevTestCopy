function handleButtonClick(button) {
  const itemID = button.getAttribute("data-itemid");
  const isAssigned = button.getAttribute("data-isassigned");
  const msg1 = button.getAttribute("data-msg1");
  const msg2 = button.getAttribute("data-msg2");
  const layoutID = button.getAttribute("data-layoutid");

try{

let selectedListName = window.parent.document.querySelectorAll('li[class="au-target nav-item active"]')[1].querySelector("div").querySelector("div").innerHTML

let tabViews = sessionStorage.getItem("tabbedViewPanels");
let views = JSON.parse(tabViews)[0];

let listName = selectedListName
let selectedList = views.tabNodes.filter(item=> {return item.displayName === listName})[0]

var selectedListId = ""
let parentId = selectedList.parentId
let worklistId = selectedList.usage.SelectedWorklist

let listIdIndex = worklistId.indexOf('.')

if (listIdIndex !== -1) {
    selectedListId = worklistId.substring(listIdIndex + 1);
  }

console.log('Selected List ID:', selectedListId);
}
catch (e){
console.log("Error", e);
}
  const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:def="http://schemas.cordys.com/default">
              <soapenv:Header/>
              <soapenv:Body>
                  <def:AutoGetNextTaskRTF>
                      <def:TaskItemId1>${itemID}</def:TaskItemId1>
                      <def:TaskAssigned>${isAssigned}</def:TaskAssigned>
                      <def:CompleteMsg>${msg1}</def:CompleteMsg>
                      <def:ErrorMsg>${msg2}</def:ErrorMsg>
                      <def:LayoutId>${layoutID}</def:LayoutId >
                      <def:TaskListId>${selectedListId}</def:TaskListId>
				   
                    </def:AutoGetNextTaskRTF>
              </soapenv:Body>
          </soapenv:Envelope>`;


  sendSOAPRequest(soapRequest, button);
}

async function sendSOAPRequest(body, button) {
  const cookies = getCookieWithCT();
  if (Object.keys(cookies).length === 0) return;

  const response =
    window.parent.publicAPIProvider.resolveUserAndSystemDetails("system");
  const urlParams = new URLSearchParams(cookies).toString();
  const finalUrl = `${response.baseDomain}${response.baseurl}com.eibus.web.soap.Gateway.wcp?${urlParams}`;
  const samlArt = getSAMLartCookie();

  if (!samlArt) return;

  const headers = {
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "text/xml; charset=UTF-8",
    SOAPAction: '""',
    SAMLart: samlArt,
  };

  try {
    const data = await $.ajax({
      url: finalUrl,
      type: "POST",
      headers: headers,
      data: body,
      contentType: "text/xml; charset=UTF-8",
    });



    let xmlDoc =
      typeof data === "string"
        ? new DOMParser().parseFromString(data, "text/xml")
        : data;
    const nsResolver = (prefix) =>
      prefix === "def" ? "http://schemas.cordys.com/default" : null;
	  
	 const itemID = xmlDoc
      .evaluate(
        "//def:TaskItemId1",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();
    const isAssigned = xmlDoc
      .evaluate(
        "//def:TaskAssigned",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();
        const CompleteMsg = xmlDoc
      .evaluate("//def:CompleteMsg", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue.trim();
    const ErrorMsg = xmlDoc
      .evaluate("//def:ErrorMsg", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue.trim();
    const TaskListId = xmlDoc
      .evaluate("//def:TaskListId", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue.trim();    
    const layoutID = xmlDoc
      .evaluate(
        "//def:LayoutId",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();

  
	const  containerID = button.getAttribute("data-containerid");
	  
    if (isAssigned === "true") {
   // copyToClipboard(msg2);

      $("#taskMessage").html("Task is assigned!").fadeIn();

      const redirectURL = `${response.baseDomain}${response.baseurl}app/start/web/item/${itemID}/${layoutID}/${containerID}`;

      setTimeout(() => {
        window.top.location.href = redirectURL;
      }, 100);
    } else {
      $("#taskMessage").html("No task left to assign!").fadeIn();

      setTimeout(() => {
        $("#taskMessage").fadeOut();
      }, 3000);
    }
  } catch (error) {
    console.error("Error in AJAX:", error);
  }
}

function copyToClipboard(text) {
    if (window.location.protocol === "https:") {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                console.log("Copied to clipboard:", text);
            }).catch((err) => {
                console.error("Clipboard copy failed:", err);
            });
            return;
        }
    }

    let tempInput = document.createElement("textarea");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    console.log("Fallback copied:", text);
}


function getCookieWithCT() {
  const regex = /(\b\w+_ct)=(\S+)/g;
  const matches = document.cookie.matchAll(regex);
  let result = {};
  for (let match of matches) result[match[1]] = match[2];
  return result;
}

function getSAMLartCookie() {
  let samlArt =
    localStorage.getItem("SAMLart") || sessionStorage.getItem("SAMLart");
  if (!samlArt) {
    const regex = /(\b\w+_SAMLart)=(\S+)/g;
    const matches = document.cookie.matchAll(regex);
    for (let match of matches) return match[2];
  }
  return samlArt;
}
