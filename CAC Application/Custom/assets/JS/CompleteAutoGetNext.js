function handleButtonClick(button) {

 const buttonText = button.innerHTML;

  const $button = $(button);
  $button.prop("disabled", true).text("Processing...");
  
  
  const url = window.top.location.href
  console.log(url)
  
  const taskID = url.substr(url.search("item/"), url.length).split("/")[1];
  const taskQueue = button.getAttribute("data-taskqueue");
  const homeLayoutID = button.getAttribute("data-homepageid");
  const listID = button.getAttribute("data-listid");
  const itemID = button.getAttribute("data-itemid");
  const isAssigned = button.getAttribute("data-isassigned");
  const msg1 = button.getAttribute("data-msg1");
  const msg2 = button.getAttribute("data-msg2");
  const layoutID = button.getAttribute("data-layoutid");
  const containerID = button.getAttribute("data-containerid");
  const ID = button.getAttribute("data-id");

  const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:def="http://schemas.cordys.com/default">
              <soapenv:Header/>
              <soapenv:Body>
                   <def:CompleteAndGetNextTask>
		    <def:TaskId>${taskID}</def:TaskId>
		    <def:TaskQueue>${taskQueue}</def:TaskQueue>
                    <def:ItemId>${itemID}</def:ItemId>
		    <def:IsAssigned>${isAssigned}</def:IsAssigned>
                    <def:Msg1>${msg1}</def:Msg1>
		     <def:Msg2>${msg2}</def:Msg2>
                     <def:LayoutId>${layoutID}</def:LayoutId >
		     <def:ContainerId>${containerID}</def:ContainerId>
		     <def:ListId>${listID}</def:ListId>
                      <def:Id>${ID}</def:Id>
                    </def:CompleteAndGetNextTask>
              </soapenv:Body>
          </soapenv:Envelope>`;


  sendSOAPRequest(soapRequest, button).finally(() => {
            $button.prop("disabled", false).text(buttonText); // Always re-enable button
        });
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
        "//def:ItemId",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();
    const isAssigned = xmlDoc
      .evaluate(
        "//def:IsAssigned",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();
        const msg1 = xmlDoc
      .evaluate("//def:Msg1", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue.trim();
    const msg2 = xmlDoc
      .evaluate("//def:Msg2", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue.trim();
    const taskQueue = xmlDoc
      .evaluate(
        "//def:TaskQueue",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
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
 const containerID= xmlDoc
      .evaluate(
        "//def:ContainerId",
        xmlDoc,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      )
      .stringValue.trim();

  
  const homePageLayoutID = button.getAttribute("data-homepageid");
  
    if (isAssigned === "true") {
//    copyToClipboard(msg2);

      $("#taskMessage").html("Task is assigned!").fadeIn();

      const redirectURL = `${response.baseDomain}${response.baseurl}app/start/web/item/${itemID}/${layoutID}/${containerID}`

      setTimeout(() => {
        window.top.location.href = redirectURL;
      }, 100);
    } else {
	  const redirectURL = `${response.baseDomain}${response.baseurl}app/start/web/pages/${homePageLayoutID}`;
	  setTimeout(() => {
        window.top.location.href = redirectURL;
      }, 100);
console.log("Data: ", data)
console.log("XML DOC:", xmlDoc)
      $("#taskMessage").html("No task left to assign!").fadeIn();
	  

      setTimeout(() => {
        $("#taskMessage").fadeOut();
      }, 3000);
    }
  } catch (error) {
     $button.prop("disabled", false).text(buttonText);
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
