function handleButtonClick(button) {

document.querySelectorAll('[id="complete"]').forEach(btn => {
  btn.disabled = true;
});

    const buttonText = button.innerHTML;
    const $button = $(button);
    $button.prop("disabled", true).text("Processing...");

    const tab = Array.from(window.parent.document.querySelectorAll('.nav-link.au-target')).find(el => {
        const label = el.querySelector('.nav-label');
        return label && label.textContent.trim() === "Contract Details";
    });

    const errorIcon = tab?.querySelector('img.tabError');
    const isInError = errorIcon && !errorIcon.classList.contains('aurelia-hide');

    if (isInError) {
        // Add shake animation class
        button.classList.add('shake');

        // Remove shake class after animation completes
        button.addEventListener('animationend', () => {
            button.classList.remove('shake');                           
        }, { once: true });

        // Show fade message
        $("#taskMessage").html("Form Errors!").fadeIn();

        // Hide message after 3 seconds
        setTimeout(() => {
            $("#taskMessage").fadeOut();
        }, 3000);
document.querySelectorAll('[id="complete"]').forEach(btn => {
  btn.disabled = false;
});
        $button.prop("disabled", false).text(buttonText);
       return;
    }
    const url = window.top.location.href; 
    console.log(url); 
    const taskID = url.substr(url.search("item/"), url.length).split("/")[1];
    const itemID = button.getAttribute("data-itemid");
    const isAssigned = button.getAttribute("data-isassigned");
    const msg1 = button.getAttribute("data-msg1");
    const msg2 = button.getAttribute("data-msg2");
    const layoutID = button.getAttribute("data-layoutid");
    const id = button.getAttribute("data-id");
    const listID = "";
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:def="http://schemas.cordys.com/default">
	<soapenv:Header/>
	<soapenv:Body>
		<def:CompleteAndAutoGetNextTaskRTF>
			<def:TaskId>${taskID}</def:TaskId>
			<def:TaskItemId1>${itemID}</def:TaskItemId1>
			<def:TaskAssigned>${isAssigned}</def:TaskAssigned>
			<def:CompleteMsg>${msg1}</def:CompleteMsg>
			<def:ErrorMsg>${msg2}</def:ErrorMsg>
			<def:LayoutId>${layoutID}</def:LayoutId>
			<def:TaskListId>${listID}</def:TaskListId>
			<def:Id>${id}</def:Id>
		</def:CompleteAndAutoGetNextTaskRTF>
	</soapenv:Body>
</soapenv:Envelope>`;
        sendSOAPRequest(soapRequest, button)
        .finally(() => {
            $button.prop("disabled", false).text(buttonText); // Always re-enable button
            document.querySelectorAll('[id="complete"]').forEach(btn => {
  btn.disabled = false;
});
        });
}
async function sendSOAPRequest(body, button) {
    const cookies = getCookieWithCT();
    if (Object.keys(cookies).length === 0) return;
    const response = window.parent.publicAPIProvider.resolveUserAndSystemDetails("system");
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
        let xmlDoc = typeof data === "string" ? new DOMParser().parseFromString(data, "text/xml") : data;
        const nsResolver = (prefix) => prefix === "def" ? "http://schemas.cordys.com/default" : null;
        const itemID = xmlDoc.evaluate("//def:TaskItemId1", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue.trim();
        const isAssigned = xmlDoc.evaluate("//def:TaskAssigned", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue.trim();
        const CompleteMsg = xmlDoc.evaluate("//def:CompleteMsg", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue.trim();
        const ErrorMsg = xmlDoc.evaluate("//def:ErrorMsg", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue.trim();
        const layoutID = xmlDoc.evaluate("//def:LayoutId", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue.trim();
        const containerID = button.getAttribute("data-containerid");
        const homeLayoutID = button.getAttribute("data-homepageid");
        if (isAssigned === "true") {
            // copyToClipboard(msg2);     
            $("#taskMessage").html("Task is assigned!").fadeIn();
            const redirectURL = `${response.baseDomain}${response.baseurl}app/start/web/item/${itemID}/${layoutID}/${containerID}`
            setTimeout(() => {
                window.top.location.href = redirectURL;
            }, 100);
        } else {
            const redirectURL = `${response.baseDomain}${response.baseurl}app/start/web/pages/${homeLayoutID}`;
            setTimeout(() => {
                window.top.location.href = redirectURL;
            }, 100);
            console.log("Data: ", data);
            console.log("XML DOC:", xmlDoc);
            $("#taskMessage").html("No task left to assign!").fadeIn();
            setTimeout(() => {
                $("#taskMessage").fadeOut();
            }, 3000);
        }
    } catch (error) {
        console.error("Error in AJAX:", error);
            $button.prop("disabled", false).text(buttonText); // Always re-enable button
            document.querySelectorAll('[id="complete"]').forEach(btn => {
  btn.disabled = false;
});
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
    let samlArt = localStorage.getItem("SAMLart") || sessionStorage.getItem("SAMLart");
    if (!samlArt) {
        const regex = /(\b\w+_SAMLart)=(\S+)/g;
        const matches = document.cookie.matchAll(regex);
        for (let match of matches) return match[2];
    }
    return samlArt;
}
	