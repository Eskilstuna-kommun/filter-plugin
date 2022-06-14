import Origo from 'Origo';

export default function FtlMapper(options = {}) {
  const {
    geoserverUrl
  } = options;

  const getTemplate = async (workspaceUrl) => {
    if (!workspaceUrl) return null;
    try {
      const res = await fetch(`${workspaceUrl.replace('.json', '')}/templates/content.ftl`);
      if (res.ok) {
        return await res.text();
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const getWorkspaceDatastore = async (workspaceName, layerName) => {
    if (!workspaceName || !layerName) return null;
    try {
      const res = await fetch(`${geoserverUrl}/rest/layers/${workspaceName}:${layerName}.json`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const mapContentFtl = (body) => {
    const attributes = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');

    const headerInfo = doc.querySelector('.featureInfoHeader');
    if (headerInfo) {
      const headerValue = headerInfo.querySelector('.headerText').innerHTML.split('.')[1];
      attributes.push({ ftlValue: `Rubrik (${headerValue})`, name: headerValue });

      const headerLink = headerInfo.querySelector('.headerLink');
      if (headerLink) {
        const linkValue = headerLink.href.split('.')[1];
        attributes.push({ ftlValue: `Länk (${linkValue})`, name: linkValue });
      }
    }

    const description = doc.querySelector('.featureInfoDescription');
    if (description) {
      const descriptionValue = description.querySelector('.descriptionText').innerHTML.split('.')[1];
      attributes.push({ ftlValue: 'Beskrivning', name: descriptionValue });
    }

    const imageLinks = Array.from(doc.querySelectorAll('.featureInfoImage img'));
    imageLinks.forEach((imageLink) => {
      const linkSplit = imageLink.src.split('.');
      if (linkSplit.length > 0) {
        const linkValue = linkSplit[1];
        if (attributes.some(a => a.ftlValue === `Bild-URL (${linkValue})`)) return;
        attributes.push({ ftlValue: `Bild-URL (${linkValue})`, name: linkValue });
      }
    });

    const attributeLinks = Array.from(doc.querySelectorAll('.attributeLink'));
    attributeLinks.forEach((attributeLink) => {
      const linkValue = attributeLink.href.split('.')[1];
      attributes.push({ ftlValue: `Länk (${linkValue})`, name: linkValue });
    });

    const featureInfo = Array.from(doc.querySelectorAll('.featureInfoAttributeValue'));
    featureInfo.forEach((row) => {
      const ftlValueEL = row.querySelector('.attributeText');
      const featureValueEl = row.querySelector('.valueText');

      if (!ftlValueEL || !featureValueEl) return;

      const ftlValue = ftlValueEL.innerHTML.replace(':', '');
      const featureValue = featureValueEl.innerHTML.split('.')[1];

      attributes.push({ ftlValue, name: featureValue });
    });

    return attributes;
  };

  return Origo.ui.Component({
    async getFtlMap(layer) {
      const workspace = layer.get('sourceName')
        .replaceAll(geoserverUrl, '')
        .replaceAll('/wms', '')
        .replaceAll('/wfs', '')
        .replaceAll('/', '');
      const workspaceResult = await getWorkspaceDatastore(workspace, layer.get('name'));
      if (!workspaceResult) return null;
      const contentFtl = await getTemplate(workspaceResult.layer.resource.href);
      if (!contentFtl) return null;
      return mapContentFtl(contentFtl);
    }
  });
}
