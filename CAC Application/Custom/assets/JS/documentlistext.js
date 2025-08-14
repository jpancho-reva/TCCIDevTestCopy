$(document).ready(async function () {
  const parentUrl = window.parent.location.href;

  function extractParamsFromUrl(url) {
    const regex = /[?&](ApplicationNum|AccountNumber)=([^&]+)/g;
    const params = {};
    let match;

    while ((match = regex.exec(url)) !== null) {
      params[match[1]] = match[2];
    }

    return params;
  }

  const params = extractParamsFromUrl(parentUrl);
  const applicationNum = params.ApplicationNum;
  const accountNumber = params.AccountNumber;

console.log ("Application number: ", applicationNum, "Acc: ", accountNumber)

  const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:def="http://schemas.cordys.com/default">
   <soapenv:Header/>
   <soapenv:Body>
      <def:GetItemByApplicationAndAccount>
         <def:ApplicationNum>${applicationNum}</def:ApplicationNum>
         <def:AccountNumber>${accountNumber}</def:AccountNumber>
      </def:GetItemByApplicationAndAccount>
   </soapenv:Body>
</soapenv:Envelope>`;

  const cookies = getCookieWithCT();
  if (Object.keys(cookies).length === 0) return;
  const samlArt = getSAMLartCookie();
  console.log("SAMLart:", samlArt);

  if (!samlArt || Object.keys(cookies).length === 0) {
    console.error("Missing SAMLart or CT cookies.");
    return;
  }
  const urlParams = new URLSearchParams(cookies).toString();
  const systemDetails = window.parent.publicAPIProvider.resolveUserAndSystemDetails("system");
  const finalUrl = `${systemDetails.baseDomain}${systemDetails.baseurl}com.eibus.web.soap.Gateway.wcp?${urlParams}&ApplicationNum=${applicationNum}&AccountNumber=${accountNumber}`;
  console.log("Final URL:", finalUrl);

  try {
    const responseXml = await $.ajax({
      url: finalUrl,
      type: "POST",
      data: soapRequest,
      headers: {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "text/xml; charset=UTF-8",
        "SOAPAction": "",
        "SAMLart": samlArt,
      },
      dataType: "xml",
    });

    console.log("Response XML:", responseXml);
 
    const xmlString = new XMLSerializer().serializeToString(responseXml);
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");

    const itemIdElement = xmlDoc.getElementsByTagNameNS("http://schemas.cordys.com/default", "ItemId")[0];
    const itemId = itemIdElement ? itemIdElement.textContent.trim() : null;

    console.log("Extracted ItemId:", itemId);

    if (itemId) {
      const layoutId = "000C29A4908DA1F0870F3BA5588D3D27";
      const containerId = "c0fc23cfa61f3df29e5b8f7b3c99d70e";

      const redirectUrl = `${systemDetails.baseDomain}${systemDetails.baseurl}app/start/web/item/${itemId}/${layoutId}/${containerId}`;
      window.top.location.href = redirectUrl;
    } else {
      const redirectUrl = `${systemDetails.baseDomain}${systemDetails.baseurl}app/start/web/pages/000C29A4908DA1F08F17C31A81D0FD29`;
      window.top.location.href = redirectUrl;
    }
  } catch (error) {
    console.error("SOAP request failed:", error);
  }
console.log("Redirecting to:", redirectUrl);


  function getCookieWithCT() {
    const regex = /(\b\w+_ct)=(\S+)/g;
    const matches = document.cookie.matchAll(regex);
    let result = {};
    for (let match of matches) {
      result[match[1]] = match[2];
    }
    return result;
  }


  function getSAMLartCookie() {
    let samlArt = localStorage.getItem("SAMLart") || sessionStorage.getItem("SAMLart");
    if (!samlArt) {
      const regex = /(\b\w+_SAMLart)=(\S+)/g;
      const matches = document.cookie.matchAll(regex);
      for (let match of matches) {
        return match[2];
      }
    }
    return samlArt;
  }
});
