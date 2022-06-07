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
      attributes.push({ ftlValue: 'Namn', name: headerValue });
    }

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
