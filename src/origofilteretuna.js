import Origo from 'Origo';
import isOverlapping from './utils/overlapping.js';
import FtlMapper from './utils/ftl-mapper.js';
import customWMSLoadFunction from './utils/imageloadfunc.js';
import getAbsoluteSourceURL from './utils/absolute_url.js';

const Origofilteretuna = function Origofilteretuna(options = {}) {
  let viewer;
  let target;
  let filterDiv;
  let filterButton;
  let filterBox;
  let filterBoxContent;
  let simpleModeButton;
  let advancedModeButton;
  let myFilterModeButton;
  let createFilterButton;
  let removeAllFilterButton;
  let removeFilterButton;
  let removeAttributeButton;
  let removeAttributeButtonSpan;
  let addAttributeButton;
  let myFilterRemoveButton;
  let myFilterEditButton;
  let myFilterDisplayButton;
  let modeControl;
  let dividerTop;
  let dividerBottom;
  let layerSelect;
  let attributeSelect;
  let operatorSelect;
  let logicSelect;
  let attributeRow;
  let attributeText;
  let operatorText;
  let logicFirstText;
  let logicSecondText;
  let valueText;
  let advancedText;
  let layerText;
  let attributeTextDiv;
  let addAttributeDiv;
  let logicDiv;
  let simpleDiv;
  let advancedDiv;
  let filterContentDiv;
  let filterInnerDiv;
  let myFilterDiv;
  let attributeWarningDiv;
  let myFilterList;
  let cqlStringTextarea;
  let filterInput;
  let statusIcon;
  let statusNumbers;
  let selectedLayer;
  let layers;
  let properties;
  let sharemap;
  let filterJson = { filters: [] };
  let isActive = false;
  let addedListener = false;
  let attributesWithSpecialChars;
  let breakingWidth = 0;
  let mode = 'simple';
  let ftlMapper;
  const name = 'origofilteretuna';
  const dom = Origo.ui.dom;
  const layerTypes = ['WMS', 'WFS'];
  const operators = [' = ', ' <> ', ' < ', ' > ', ' <= ', ' >= ', ' like ', ' between '];
  // https://openlayers.org/en/latest/apidoc/module-ol_Image.html#~LoadFunction
  // https://openlayers.org/en/latest/apidoc/module-ol_Tile.html#~LoadFunction
  const defaultWMSImageLoadFunction = function defaultWMSImageLoadFunction(image, src) {
    const WMSImage = image;
    WMSImage.getImage().src = src;
  };
  const defaultWMSTileLoadFunction = (function defaultWMSTileLoadFunction(tile, src) {
    const WMSTile = tile;
    WMSTile.getImage().src = src;
  });
  const currentlyFilteredLayers = [];

  const hideButtonWhenEmbedded = 'hideButtonWhenEmbedded' in options ? options.hideButtonWhenEmbedded : false;
  const excludedAttributes = Object.prototype.hasOwnProperty.call(options, 'excludedAttributes') ? options.excludedAttributes : [];
  const excludedLayers = Object.prototype.hasOwnProperty.call(options, 'excludedLayers') ? options.excludedLayers : [];
  const optionBackgroundColor = Object.prototype.hasOwnProperty.call(options, 'optionBackgroundColor') ? options.optionBackgroundColor : '#e1f2fe';
  const filterPrefix = Object.prototype.hasOwnProperty.call(options, 'filterPrefix') ? options.filterPrefix : 'Filter - ';
  const indicatorBackgroundColor = Object.prototype.hasOwnProperty.call(options, 'indicatorBackgroundColor') ? options.indicatorBackgroundColor : '#ff0000';
  const indicatorTextColor = Object.prototype.hasOwnProperty.call(options, 'indicatorTextColor') ? options.indicatorTextColor : '#ffffff';
  const actLikeRadioButton = Object.prototype.hasOwnProperty.call(options, 'actLikeRadioButton') ? options.actLikeRadioButton : true;
  const tooltipText = Object.prototype.hasOwnProperty.call(options, 'tooltipText') ? options.tooltipText : 'Filter';
  const warningTooltipText = Object.prototype.hasOwnProperty.call(options, 'warningTooltipText') ? options.warningTooltipText : 'Attribut med Å, Ä, Ö eller mellanslag kan inte användas för filtrering';
  const warningBackgroundColor = Object.prototype.hasOwnProperty.call(options, 'warningBackgroundColor') ? options.warningBackgroundColor : '#fff700';
  const warningTextColor = Object.prototype.hasOwnProperty.call(options, 'warningTextColor') ? options.warningTextColor : '#000000';
  const warningText = Object.prototype.hasOwnProperty.call(options, 'warningText') ? options.warningText : 'OBS!';
  const geoserverUrl = Object.prototype.hasOwnProperty.call(options, 'geoserverUrl') ? options.geoserverUrl : undefined;

  function handleOverlapping() {
    if (document.getElementsByClassName('o-search').length > 0) {
      const search = document.getElementsByClassName('o-search')[0];
      const filter = document.getElementById(filterBoxContent.getId());

      if (isOverlapping(search, filter)) {
        document.getElementById(filterBox.getId()).style.top = '4rem';
        breakingWidth = window.innerWidth;
      } else if (window.innerWidth > breakingWidth) {
        document.getElementById(filterBox.getId()).style.top = '1rem';
      }
    }
  }

  function setActive(state) {
    isActive = state;
  }

  function getVisibleLayers() {
    return viewer.getLayers().filter((layer) => layerTypes.includes(layer.get('type')) && !excludedLayers.includes(layer.get('name')) && layer.get('visible') && !layer.get('ArcGIS'));
  }

  function getCqlFilterFromLayer(layer) {
    let filter = '';
    if (layer.get('type') === 'WMS') {
      const params = layer.getSource().getParams();
      if (params.CQL_FILTER) {
        filter = params.CQL_FILTER;
      }
    } else if (layer.get('type') === 'WFS') {
      if (layer.get('ogccqlFilter')) {
        filter = layer.get('ogccqlFilter');
      }
    }
    return filter;
  }

  function getNumberOfLayersWithFilter() {
    return viewer.getLayers().filter((layer) => getCqlFilterFromLayer(layer) !== '').length;
  }

  function setNumberOfLayersWithFilter(isEmbedded) {
    if (isEmbedded && (hideButtonWhenEmbedded === true)) {
      document.getElementById(statusIcon.getId()).classList.add('o-hidden');
    } else {
      const numberOfFilters = getNumberOfLayersWithFilter();
      document.getElementById(statusNumbers.getId()).innerHTML = numberOfFilters;
      document.getElementById('myFilterCount').innerHTML = numberOfFilters;

      if (numberOfFilters > 0) {
        document.getElementById(statusIcon.getId()).classList.remove('o-hidden');
      } else {
        document.getElementById(statusIcon.getId()).classList.add('o-hidden');
      }
    }
  }

  function checkSpecialCharacters(item) {
    const specialChars = ['å', 'ä', 'ö', 'Å', 'Ä', 'Ö'];
    let hasSpecialChar = false;

    specialChars.forEach((char) => {
      if (item.includes(char)) {
        hasSpecialChar = true;
      }
    });

    return hasSpecialChar;
  }

  function getSourceUrl(layer) {
    const url = viewer.getSource(layer.get('sourceName')).url;
    // Ta bort "wms" eller "wfs"
    return url.slice(0, -3);
  }

  async function getWfsFeatures(layer, filter) {
    const filterArr = [];
    if (filter) {
      const tempArr = filter.split(' ');
      // OBS! Om CQL filter sätts på en egenskap med specialtecken t.ex. å, ä eller ö måste egenskapen kapslas in med enkel-citat
      // OBS! Om en egenskap behövs kapslas in så behövs de andra egenskaperna i anropet också det.
      const hasSpecialChar = checkSpecialCharacters(filter);

      tempArr.forEach((item, index) => {
        let isAttribute = false;

        operators.forEach((operator) => {
          if (tempArr[index + 1] === operator.trim()) {
            isAttribute = true;
          }
        });

        if (hasSpecialChar && isAttribute) {
          filterArr.push(`'${item}'`);
        } else {
          filterArr.push(item);
        }
      });
    }
    const sourceUrl = getSourceUrl(layer);
    const body = new URLSearchParams();
    body.set('service', 'WFS');
    body.set('version', '1.1.1');
    body.set('request', 'GetFeature');
    body.set('outputFormat', 'application/json');
    body.set('typeNames', layer.get('name').split('__')[0]);
    if (filter) {
      body.set('FILTER', filterArr.join(' '));
    }

    const WFSOptions = {
      method: 'POST',
      body
    };

    const result = await fetch(`${sourceUrl}wfs?`, WFSOptions);
    const JSONresult = await result.json();
    return JSONresult;
  }

  async function getFeatureProps(layer) {
    try {
      const sourceUrl = getSourceUrl(layer);
      const url = [
        `${sourceUrl}`,
        'wfs?version=1.3.0&request=describeFeatureType&outputFormat=application/json&service=WFS',
        `&typeName=${layer.get('name').split('__')[0]}`
      ].join('');

      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function getProperties(layer) {
    let ftlProps = [];
    if (ftlMapper) {
      const mappedContent = await ftlMapper.getFtlMap(layer);
      if (mappedContent && mappedContent.length > 0) {
        ftlProps = mappedContent;
      }
    }

    const response = await getFeatureProps(layer);
    if (!response) return ftlProps;

    const featureProps = response.featureTypes[0].properties;
    const newProps = [];
    featureProps.forEach((prop) => {
      const obj = prop;
      if (ftlProps.length > 0) {
        const matchingProp = ftlProps.find((f) => f.name === obj.name);
        if (matchingProp) {
          obj.ftlValue = matchingProp.ftlValue;
          ftlProps = ftlProps.filter((f) => f.name !== matchingProp.name);
        }
      }
      newProps.push(obj);
    });
    if (ftlProps.length > 0) {
      newProps.push(...ftlProps);
    }
    return newProps.filter((prop) => !excludedAttributes.includes(prop.name));
  }

  async function addAttributeRow(attribute, operator, value, firstRow) {
    const row = document.getElementsByClassName('attributeRow')[0];
    const clone = firstRow ? row : row.cloneNode(true);

    if (attribute) {
      if (!properties) {
        properties = await getProperties(selectedLayer);
      }
      const attrIndex = properties.findIndex((prop) => prop.name === attribute);
      clone.querySelector(`#${attributeSelect.getId()}`).selectedIndex = attrIndex;
    }

    if (operator) {
      const oprIndex = operators.findIndex((opr) => opr === operator);
      clone.querySelector(`#${operatorSelect.getId()}`).selectedIndex = oprIndex;
    }

    if (value) {
      clone.querySelector('input').value = value;
    } else {
      clone.querySelector('input').value = '';
    }

    if (!firstRow) {
      clone.querySelector('button').classList.remove('o-hidden');
      clone.querySelector('button').addEventListener('click', () => {
        clone.remove();
      });
    }

    const lastElement = document.getElementsByClassName('attributeRow').length - 1;
    document.getElementsByClassName('attributeRow')[lastElement].after(clone);
  }

  function removeAttributeRows() {
    document.getElementsByClassName('attributeRow')[0].querySelector(`#${attributeSelect.getId()}`).selectedIndex = 0;
    document.getElementsByClassName('attributeRow')[0].querySelector(`#${operatorSelect.getId()}`).selectedIndex = 0;
    document.getElementsByClassName('attributeRow')[0].querySelector('input').value = '';

    const rows = document.getElementsByClassName('attributeRow').length;
    for (let i = 1; i < rows; i += 1) {
      document.getElementsByClassName('attributeRow')[1].remove();
    }
  }

  function setAttributeRowsToFilter(filterString) {
    if (filterString !== '') {
      const hasOR = filterString.includes(' OR ');
      const hasAND = filterString.includes(' AND ');

      // Om det finns både OR och AND så kan det inte visas korrekt i det enkla gränssnittet.
      if (hasOR && hasAND) return;

      const logicOperator = hasOR ? 'OR' : 'AND';
      const filterArray = filterString.split(` ${logicOperator} `);
      document.getElementById(logicSelect.getId()).selectedIndex = hasAND ? 1 : 0;

      removeAttributeRows();

      filterArray.forEach((filter, index) => {
        const filterArr = filter.split(' ');
        const attr = filterArr[0];
        const opr = filterArr[1];

        const valueArr = [];
        for (let i = 2; i < filterArr.length; i += 1) {
          valueArr.push(filterArr[i].replaceAll("'", ''));
        }
        const value = valueArr.join(' ');

        const firstRow = index === 0;
        addAttributeRow(attr, ` ${opr} `, value, firstRow);
      });
    }
  }

  function setMyFilters() {
    document.getElementById(myFilterList.getId()).innerHTML = '';
    filterJson.filters.forEach((filter) => {
      const node = document.createElement('li');
      node.id = filter.layerName;
      node.classList = 'rounded border text-smaller padding-small margin-top-small relative o-tooltip';

      // Create the first paragraph (Lager)
      const firstParagraph = document.createElement('p');
      firstParagraph.style.overflowWrap = 'break-word';
      firstParagraph.style.width = '18rem';

      const lagerSpan = document.createElement('span');
      lagerSpan.className = 'text-weight-bold';
      lagerSpan.textContent = 'Lager: ';

      firstParagraph.appendChild(lagerSpan);
      firstParagraph.appendChild(document.createTextNode(filter.title));

      // Create the second paragraph (Filter)
      const secondParagraph = document.createElement('p');
      secondParagraph.style.overflowWrap = 'break-word';

      const filterSpan = document.createElement('span');
      filterSpan.className = 'text-weight-bold';
      filterSpan.textContent = 'Filter: ';

      secondParagraph.appendChild(filterSpan);
      secondParagraph.appendChild(document.createTextNode(filter.ogccqlFilter));

      // Append paragraphs to the list item
      node.appendChild(firstParagraph);
      node.appendChild(secondParagraph);

      // Convert HTML strings to DOM nodes and append them to the list item
      const tempContainer = document.createElement('div');

      tempContainer.innerHTML = myFilterRemoveButton.render();
      node.appendChild(tempContainer.firstElementChild);

      tempContainer.innerHTML = myFilterEditButton.render();
      node.appendChild(tempContainer.firstElementChild);

      tempContainer.innerHTML = myFilterDisplayButton.render();
      node.appendChild(tempContainer.firstElementChild);

      // Handle visibility and disabling of buttons based on layer visibility
      const layer = viewer.getLayer(filter.layerName);
      if (!layer || !layer.get('visible')) {
        node.querySelector('.edit-filter').classList.add('disabled');
        node.querySelector('.display-filter').classList.remove('o-hidden');
      } else {
        node.querySelector('.display-filter').classList.add('o-hidden');
      }
      // Append the list item to the filter list
      document.getElementById(myFilterList.getId()).appendChild(node);
    });
  }

  function removeFilterTagAndBackground(index) {
    const select = document.getElementById(layerSelect.getId());
    const currentText = select.options[index].text;
    select.options[index].text = currentText.replace(filterPrefix, '');
    select.options[index].style = '';
  }

  function removeAllFilterTagsAndBackgrounds() {
    const select = document.getElementById(layerSelect.getId());
    Array.from(select.options).forEach((option) => {
      select.options[option.index].text = option.text.replace(filterPrefix, '');
      select.options[option.index].style = '';
    });
  }

  function addFilterTagAndBackground(layerName) {
    const select = document.getElementById(layerSelect.getId());
    Array.from(select.options).forEach((option, index) => {
      if (option.value === layerName) {
        removeFilterTagAndBackground(index);
        const currentText = option.text;
        select.options[index].text = `${filterPrefix}${currentText}`;
        select.options[index].style = `background-color: ${optionBackgroundColor}`;
      }
    });
  }

  async function setWfsFeaturesOnLayer(layer, filter) {
    layer.set('ogccqlFilter', filter);
    const features = await getWfsFeatures(layer, filter);
    const layerSource = layer.getSource();

    layerSource.clear(true);
    layerSource.addFeatures(layerSource.getFormat().readFeatures(features));
  }

  function setIndicators(layerName, mapIsEmbedded) {
    addFilterTagAndBackground(layerName);
    setNumberOfLayersWithFilter(mapIsEmbedded);
  }

  /**
   * Sets the load function for a WMS source.
   *
   * @param {Object} WMSSource - The WMS source object.
   * @param {Boolean} setDefaultFunction - Whether to set the predefineddefault load function or a custom one.
   */
  function setWMSLoadFunction(WMSSource, setDefaultFunction) {
    if (WMSSource.imageLoadFunction) {
      if (setDefaultFunction) {
        WMSSource.setImageLoadFunction(defaultWMSImageLoadFunction);
      } else WMSSource.setImageLoadFunction(customWMSLoadFunction);
    } else if (WMSSource.tileLoadFunction) {
      if (setDefaultFunction) {
        WMSSource.setTileLoadFunction(defaultWMSTileLoadFunction);
      } else WMSSource.setTileLoadFunction(customWMSLoadFunction);
    }
  }

  function getWMSLoadFunction(WMSSource) {
    const returnObj = {
      WMSType: ''
    };
    if (WMSSource.imageLoadFunction) {
      returnObj.WMSType = 'image';
      returnObj.funct = WMSSource.getImageLoadFunction();
      return returnObj;
    }
    returnObj.WMSType = 'tile';
    returnObj.funct = WMSSource.getTileLoadFunction();
    return returnObj;
  }

  /**
   * Checks if a layer has another (than this plugin's) custom WMS load function with a POST request.
   * Checks for the Origo requestMethod param and if necessary the function itself for the 'post' keyword
   *
   * @param {Object} layer - The layer object to check.
   * @return {Boolean} True if the layer has another custom WMS load function with a POST request, false otherwise.
   */
  function hasOtherCustomWMSLoadFunctionWithPost(layer) {
    const mapSources = viewer.getMapSource();
    const sourceName = layer.get('sourceName');
    if ((mapSources[sourceName]?.requestMethod) && (mapSources[sourceName].requestMethod.toLowerCase() === 'post')) {
      return true;
    }
    if (layer.get('requestMethod') && (layer.get('requestMethod').toLowerCase() === 'post')) {
      return true;
    }
    const obj = getWMSLoadFunction(layer.getSource());
    if (obj.funct !== customWMSLoadFunction) {
      if ((obj.funct.toString().includes('post')) || (obj.funct.toString().includes('POST'))) {
        return true;
      }
    }
    return false;
  }

  function setWMSLoadFunctionIfNeeded(WMSSource, layer) {
    const usesPost = hasOtherCustomWMSLoadFunctionWithPost(layer);
    const WMSSourceLoadFunctionObj = getWMSLoadFunction(WMSSource);
    if ((WMSSourceLoadFunctionObj.funct !== customWMSLoadFunction) && (!(usesPost))) {
      setWMSLoadFunction(WMSSource, false);
    }
  }

  function setSharedFilters() {
    filterJson.filters.forEach((filter) => {
      const layer = viewer.getLayer(filter.layerName);
      if (layer.get('type') === 'WMS') {
        const WMSSource = layer.getSource();
        setWMSLoadFunctionIfNeeded(WMSSource, layer);
        let paramsUpdated = false;

        if (layer.getSource().getState() === 'ready') {
          layer.getSource().updateParams({ layers: filter.layerName, CQL_FILTER: filter.cqlFilter });
          paramsUpdated = true;
        }
        if (!(paramsUpdated)) {
          layer.getSource().once('change', () => {
            layer.getSource().updateParams({ layers: filter.layerName, CQL_FILTER: filter.cqlFilter });
          });
        }
        setIndicators(filter.layerName, viewer.getEmbedded());
        currentlyFilteredLayers.push(layer);
      } else if (layer.get('type') === 'WFS') {
        layer.getSource().once('change', () => {
          if (layer.getSource().getState() === 'ready') {
            setWfsFeaturesOnLayer(layer, filter.cqlFilter);
            setIndicators(filter.layerName, viewer.getEmbedded());
            currentlyFilteredLayers.push(layer);
          }
        });
      }
    });
  }

  function removeFromJson(layerName) {
    if (layerName) {
      filterJson.filters.forEach((filter, index) => {
        if (filter.layerName === layerName) {
          filterJson.filters.splice(index, 1);
        }
      });
    } else {
      filterJson = { filters: [] };
    }
  }

  function createOgcFilterOpr(opr) {
    let oprProp;

    if (opr === '=') {
      oprProp = 'PropertyIsEqualTo';
    } else if (opr === ' <> ') {
      oprProp = 'PropertyIsNotEqualTo';
    } else if (opr === ' < ') {
      oprProp = 'PropertyIsLessThan';
    } else if (opr === ' <= ') {
      oprProp = 'PropertyIsLessThanOrEqualTo';
    } else if (opr === ' > ') {
      oprProp = 'PropertyIsGreaterThan';
    } else if (opr === ' >= ') {
      oprProp = 'PropertyIsGreaterThanOrEqualTo';
    } else if (opr === ' like ') {
      oprProp = 'PropertyIsLike';
    } else if (opr === ' between ') {
      oprProp = 'PropertyIsBetween';
    } else {
      oprProp = 'PropertyIsEqualTo';
    }

    return `${oprProp}`;
  }

  function createCqlFilter() {
    let filterString = '';
    if (mode === 'simple') {
      const filters = [];
      const filters2 = [];
      const rows = Array.from(document.getElementsByClassName('attributeRow'));
      const logic = document.getElementById(logicSelect.getId()).value;

      rows.forEach((row) => {
        const att = row.querySelector(`#${attributeSelect.getId()}`).value;
        const opr = row.querySelector(`#${operatorSelect.getId()}`).value;
        const val = row.querySelector('input').value;

        if (val !== '' && selectedLayer.get('type') === 'WMS') {
          filters.push(`${att}${opr}'${val}'`);
          filterString = filters.join(` ${logic} `);
          document.getElementById(cqlStringTextarea.getId()).value = filterString;
        } else if (selectedLayer.get('type') === 'WFS') {
          filters.push(`<${createOgcFilterOpr(opr)}><PropertyName>${att}</PropertyName><Literal>${val}</Literal></${createOgcFilterOpr(opr)}>`);
          filterString = (`<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:${logic}>${filters.join('')}</ogc:${logic}></ogc:Filter>`);
          document.getElementById(cqlStringTextarea.getId()).value = filterString;
        }
      });
    } else if (mode === 'advanced') {
      filterString = document.getElementById(cqlStringTextarea.getId()).value;
    }

    if (selectedLayer.get('type') === 'WMS') {
      const WMSSource = selectedLayer.getSource();
      WMSSource.setUrl(getAbsoluteSourceURL(WMSSource));
      setWMSLoadFunctionIfNeeded(WMSSource, selectedLayer);
      WMSSource.updateParams({ layers: selectedLayer.get('id'), CQL_FILTER: filterString });
    } else if (selectedLayer.get('type') === 'WFS') {
      setWfsFeaturesOnLayer(selectedLayer, filterString);
    }
    console.log('selectedLayer:', selectedLayer);

    if (getCqlFilterFromLayer(selectedLayer) !== '') {
      currentlyFilteredLayers.push(selectedLayer);
      addFilterTagAndBackground(selectedLayer.get('name'));
      setNumberOfLayersWithFilter();
      removeFromJson(selectedLayer.get('name'));
      filterJson.filters.push({
        title: selectedLayer.get('title'),
        layerName: selectedLayer.get('name'),
        ogccqlFilter: filterString
      });
    }
  }

  function removeCqlFilter(layerName) {
    const theLayerName = layerName || selectedLayer.get('name');
    if (!(currentlyFilteredLayers.some((layer) => layer.get('name') === theLayerName))) return;
    const layer = selectedLayer || viewer.getLayer(layerName);
    document.getElementById(cqlStringTextarea.getId()).value = '';

    if (layer.get('type') === 'WMS') {
      const WMSSource = layer.getSource();
      WMSSource.updateParams({ layers: layer.get('id'), CQL_FILTER: undefined });
      if (!(hasOtherCustomWMSLoadFunctionWithPost(layer))) {
        setWMSLoadFunction(WMSSource, true);
      }
    } else if (layer.get('type') === 'WFS') {
      setWfsFeaturesOnLayer(layer);
    }

    const select = document.getElementById(layerSelect.getId());
    const selectedOption = select.querySelector(`option[value="${layerName}"]`);
    const index = layerName && selectedOption ? selectedOption.index : select.selectedIndex;

    currentlyFilteredLayers.splice(currentlyFilteredLayers.indexOf(layer), 1);
    removeFilterTagAndBackground(index);
    removeAttributeRows();
    removeFromJson(layer.get('name'));
    setNumberOfLayersWithFilter();
  }

  function removeAllCqlFilter() {
    document.getElementById(cqlStringTextarea.getId()).value = '';

    for (let i = 0; i < currentlyFilteredLayers.length; i += 1) {
      const layer = currentlyFilteredLayers[i];
      if (layer.get('type') === 'WMS') {
        const WMSSource = layer.getSource();
        if (!(hasOtherCustomWMSLoadFunctionWithPost(layer))) {
          setWMSLoadFunction(WMSSource, true);
        }
        WMSSource.updateParams({ layers: layer.get('id'), CQL_FILTER: undefined });
      } else if (layer.get('type') === 'WFS') {
        setWfsFeaturesOnLayer(layer);
      }
      currentlyFilteredLayers.splice(i, 1);
      i -= 1;
    }

    removeAllFilterTagsAndBackgrounds();
    removeAttributeRows();
    removeFromJson();
    setNumberOfLayersWithFilter();
  }

  function addOperators() {
    Array.from(document.getElementsByClassName('operatorSelect')).forEach((oprSelect) => {
      // Rensa eventuellt existerande options
      while (oprSelect.firstChild) {
        oprSelect.removeChild(oprSelect.firstChild);
      }

      // Lägg till operators till select
      operators.forEach((operator) => {
        const opt = document.createElement('option');
        opt.text = operator;
        opt.value = operator;
        oprSelect.appendChild(opt);
      });
    });
  }

  function initAttributesWithProperties() {
    Array.from(document.getElementsByClassName('attributeSelect')).forEach((attrSelect) => {
      // Rensa eventuellt existerande options
      while (attrSelect.firstChild) {
        attrSelect.removeChild(attrSelect.firstChild);
      }

      attributesWithSpecialChars = false;

      // Lägg till lagrets attribut/properties till select
      properties.forEach((property) => {
        const attribute = property.name;
        const opt = document.createElement('option');
        opt.text = property.ftlValue ? property.ftlValue : attribute;
        opt.value = attribute;

        if (checkSpecialCharacters(attribute) || attribute.includes(' ')) {
          opt.disabled = true;
          attributesWithSpecialChars = true;
        }

        attrSelect.appendChild(opt);
      });
    });
  }

  async function selectListener(evt) {
    if (evt.target.value === '') {
      document.getElementById(filterContentDiv.getId()).classList.add('o-hidden');
      return;
    }

    selectedLayer = viewer.getLayer(evt.target.value);
    properties = await getProperties(selectedLayer);

    if (properties.length <= 0) {
      document.getElementById(filterContentDiv.getId()).classList.add('o-hidden');
      return;
    }

    initAttributesWithProperties();
    removeAttributeRows();

    const currentFilter = getCqlFilterFromLayer(selectedLayer);
    document.getElementById(cqlStringTextarea.getId()).value = currentFilter;

    if (currentFilter !== '') {
      setAttributeRowsToFilter(currentFilter);
    } else {
      document.getElementById(logicSelect.getId()).selectedIndex = 0;
      const firstAttributeRow = document.getElementsByClassName('attributeRow')[0];
      firstAttributeRow.querySelector('input').value = '';
      firstAttributeRow.querySelector(`#${operatorSelect.getId()}`).value = operators[0];
    }

    if (attributesWithSpecialChars) {
      document.getElementById(attributeWarningDiv.getId()).classList.remove('o-hidden');
    } else {
      document.getElementById(attributeWarningDiv.getId()).classList.add('o-hidden');
    }

    document.getElementById(filterContentDiv.getId()).classList.remove('o-hidden');
  }

  function renderLayerSelect() {
    const select = document.getElementById(layerSelect.getId());

    // Rensa eventuellt existerande options
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }

    const firstOpt = document.createElement('option');
    firstOpt.value = '';
    firstOpt.text = 'Välj...';
    select.appendChild(firstOpt);

    // Lägg till alla lager till select
    layers.forEach((layer) => {
      const opt = document.createElement('option');
      const filter = getCqlFilterFromLayer(layer);
      opt.value = layer.get('name');
      opt.text = `${filter !== '' ? filterPrefix : ''}${layer.get('title')}`;
      opt.style = filter !== '' ? `background-color: ${optionBackgroundColor}` : '';
      select.appendChild(opt);
    });

    addOperators();
    selectedLayer = viewer.getLayer(select.value);
    if (!addedListener) {
      select.addEventListener('change', async (evt) => selectListener(evt));
      addedListener = true;
    }
  }

  function setMode(modeString) {
    if (mode === modeString) {
      return;
    }
    mode = modeString;

    if (mode === 'simple') {
      document.getElementById(simpleModeButton.getId()).classList.add('active');
      document.getElementById(advancedModeButton.getId()).classList.remove('active');
      document.getElementById(myFilterModeButton.getId()).classList.remove('active');
      document.getElementById(simpleDiv.getId()).classList.remove('o-hidden');
      document.getElementById(advancedDiv.getId()).classList.add('o-hidden');
      document.getElementById(filterInnerDiv.getId()).classList.remove('o-hidden');
      document.getElementById(myFilterDiv.getId()).classList.add('o-hidden');
    } else if (mode === 'advanced') {
      document.getElementById(simpleModeButton.getId()).classList.remove('active');
      document.getElementById(advancedModeButton.getId()).classList.add('active');
      document.getElementById(myFilterModeButton.getId()).classList.remove('active');
      document.getElementById(simpleDiv.getId()).classList.add('o-hidden');
      document.getElementById(advancedDiv.getId()).classList.remove('o-hidden');
      document.getElementById(filterInnerDiv.getId()).classList.remove('o-hidden');
      document.getElementById(myFilterDiv.getId()).classList.add('o-hidden');
    } else if (mode === 'myfilter') {
      document.getElementById(simpleModeButton.getId()).classList.remove('active');
      document.getElementById(advancedModeButton.getId()).classList.remove('active');
      document.getElementById(myFilterModeButton.getId()).classList.add('active');
      document.getElementById(filterInnerDiv.getId()).classList.add('o-hidden');
      document.getElementById(myFilterDiv.getId()).classList.remove('o-hidden');
      setMyFilters();

      Array.from(document.getElementsByClassName('remove-filter')).forEach((el) => {
        el.addEventListener('click', () => {
          const layerName = el.parentElement.id;
          removeCqlFilter(layerName);
          setMyFilters();
          setMode('myfilter');
        });
      });

      Array.from(document.getElementsByClassName('edit-filter')).forEach((el) => {
        el.addEventListener('click', () => {
          if (!el.classList.contains('disabled')) {
            const layerName = el.parentElement.id;
            const layer = viewer.getLayer(layerName);
            const select = document.getElementById(layerSelect.getId());

            select.selectedIndex = select.querySelector(`option[value="${layerName}"]`).index;
            select.dispatchEvent(new Event('change'));

            const filterString = getCqlFilterFromLayer(layer);
            console.log('filterStringFromLayer: ', filterString);
            const hasOR = filterString.includes(' OR ');
            const hasAND = filterString.includes(' AND ');

            // Om det finns både OR och AND så kan det inte visas korrekt i det enkla gränssnittet.
            if (hasOR && hasAND) {
              setMode('advanced');
            } else {
              setMode('simple');
            }
          }
        });
      });

      Array.from(document.getElementsByClassName('display-filter')).forEach((el) => {
        el.addEventListener('click', () => {
          const layerName = el.parentElement.id;
          const layer = viewer.getLayer(layerName);
          layer.set('visible', true);
          el.parentElement.querySelector('.edit-filter').classList.remove('disabled');
          el.parentElement.querySelector('.display-filter').classList.add('o-hidden');
        });
      });
    }

    if (selectedLayer) {
      const filterString = getCqlFilterFromLayer(selectedLayer);
      setAttributeRowsToFilter(filterString);
    }
  }

  function enableInteraction() {
    document.getElementById(filterButton.getId()).classList.add('active');
    document.getElementById(filterButton.getId()).classList.remove('tooltip');
    document.getElementById(filterBox.getId()).classList.remove('o-hidden');

    if (actLikeRadioButton) {
      setActive(true);
    }
  }

  function disableInteraction() {
    document.getElementById(filterButton.getId()).classList.remove('active');
    document.getElementById(filterButton.getId()).classList.add('tooltip');
    document.getElementById(filterBox.getId()).classList.add('o-hidden');

    if (actLikeRadioButton) {
      setActive(false);
    }
  }

  function toggleFilter() {
    if (actLikeRadioButton) {
      const detail = {
        name: 'filter',
        active: !isActive
      };
      viewer.dispatch('toggleClickInteraction', detail);
    } else if (document.getElementById(filterButton.getId()).classList.contains('tooltip')) {
      enableInteraction();
      handleOverlapping();
    } else {
      disableInteraction();
    }
  }

  function addToMapState(mapState) {
    // eslint-disable-next-line no-param-reassign
    mapState[name] = filterJson;
  }

  async function handleLayerChanges() {
    layers = getVisibleLayers();
    renderLayerSelect();
    removeAttributeRows();
    if (layers.length > 0 && selectedLayer) {
      properties = await getProperties(selectedLayer);
      initAttributesWithProperties();

      const filter = getCqlFilterFromLayer(selectedLayer);
      if (filter !== '') {
        document.getElementById(cqlStringTextarea.getId()).value = filter;
        setAttributeRowsToFilter(filter);
      }
    } else {
      document.getElementById(filterContentDiv.getId()).classList.add('o-hidden');
    }

    setMyFilters();
    setMode(mode);
  }

  function addListenerToLayers() {
    viewer.getLayers().forEach((layer) => {
      if (!layer.get('changeListener')) {
        layer.set('changeListener', true);
        layer.on('change:visible', async () => {
          await handleLayerChanges();
        });
      }
    });
  }

  return Origo.ui.Component({
    name: 'origofilteretuna',
    onInit() {
      statusNumbers = Origo.ui.Element({
        tagName: 'span',
        style: {
          color: `${indicatorTextColor}`,
          position: 'absolute',
          left: '5px',
          top: '0px',
          'font-size': '0.7rem'
        },
        innerHTML: '0'
      });

      statusIcon = Origo.ui.Element({
        tagName: 'div',
        cls: 'padding-small margin-bottom-smaller round light box-shadow o-hidden',
        style: {
          width: '10px',
          height: '10px',
          bottom: '-6px',
          position: 'absolute',
          right: '0px',
          'background-color': `${indicatorBackgroundColor}`,
          'z-index': 1
        },
        components: [statusNumbers]
      });

      filterDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'flex column',
        style: {
          position: 'relative'
        },
        components: [statusIcon]
      });

      filterButton = Origo.ui.Button({
        cls: 'o-filteretuna padding-small margin-bottom-smaller icon-smaller round light box-shadow tooltip',
        click() {
          toggleFilter();
        },
        icon: '#ic_filter_24px',
        tooltipText: `${tooltipText}`,
        tooltipPlacement: 'east'
      });

      simpleModeButton = Origo.ui.Button({
        cls: 'grow light text-smaller padding-left-large active',
        text: 'Enkel',
        style: {
          width: '1rem'
        },
        state: mode === 'simple' ? 'active' : 'initial'
      });

      advancedModeButton = Origo.ui.Button({
        cls: 'grow light text-smaller padding-right-large',
        text: 'Avancerad',
        style: {
          width: '1rem'
        },
        state: mode === 'advanced' ? 'active' : 'initial'
      });

      myFilterModeButton = Origo.ui.Button({
        cls: 'grow light text-smaller padding-right-large',
        text: 'Mina filter (<span id="myFilterCount">0</span>)',
        style: {
          width: '1rem'
        },
        state: mode === 'myfilter' ? 'active' : 'initial'
      });

      modeControl = Origo.ui.ToggleGroup({
        cls: 'flex rounded bg-inverted border',
        components: [simpleModeButton, advancedModeButton, myFilterModeButton],
        style: { display: 'flex' }
      });

      filterBox = Origo.ui.Element({
        tagName: 'div',
        cls: 'flex column control box bg-white overflow-hidden o-hidden filter-box',
        style: {
          left: '4rem',
          top: '1rem',
          padding: '0.5rem',
          width: '25rem',
          'z-index': '-1'
        }
      });

      layerSelect = Origo.ui.Element({
        tagName: 'select',
        cls: 'width-100',
        style: {
          padding: '0.2rem',
          'font-size': '0.8rem'
        },
        innerHTML: '<option value="">Välj...</option>'
      });

      attributeSelect = Origo.ui.Element({
        tagName: 'select',
        cls: 'attributeSelect',
        style: {
          padding: '0.2rem',
          width: '8rem',
          'font-size': '0.8rem'
        }
      });

      operatorSelect = Origo.ui.Element({
        tagName: 'select',
        cls: 'operatorSelect',
        style: {
          padding: '0.2rem',
          width: '5rem',
          'font-size': '0.8rem',
          'margin-left': '0.4rem'
        }
      });

      logicSelect = Origo.ui.Element({
        tagName: 'select',
        style: {
          padding: '0.2rem',
          'font-size': '0.7rem'
        },
        innerHTML: '<option value="Or">något</option><option value="And">alla</option>'
      });

      dividerTop = Origo.ui.Element({
        tagName: 'div',
        style: {
          height: '1px',
          'margin-top': '0.5rem',
          'margin-bottom': '0.5rem',
          'background-color': '#e8e8e8'
        }
      });

      dividerBottom = Origo.ui.Element({
        tagName: 'div',
        style: {
          height: '1px',
          'margin-top': '0.5rem',
          'margin-bottom': '0.5rem',
          'background-color': '#e8e8e8'
        }
      });

      createFilterButton = Origo.ui.Button({
        cls: 'light rounded-large border text-smaller padding-right-large o-tooltip',
        style: {
          float: 'left',
          padding: '0.4rem',
          'background-color': '#ebebeb'
        },
        text: 'Filtrera'
      });

      removeAllFilterButton = Origo.ui.Button({
        cls: 'light rounded-large border text-smaller padding-right-large o-tooltip',
        style: {
          float: 'right',
          padding: '0.4rem',
          'background-color': '#ebebeb'
        },
        text: 'Rensa allt'
      });

      removeFilterButton = Origo.ui.Button({
        cls: 'light rounded-large border text-smaller padding-right-large o-tooltip',
        style: {
          float: 'right',
          padding: '0.4rem',
          'background-color': '#ebebeb'
        },
        text: 'Rensa'
      });

      filterInput = Origo.ui.Input({
        cls: 'placeholder-text-smaller smaller',
        value: '',
        placeholderText: '...',
        style: {
          height: '26px',
          padding: '0.3rem',
          width: '9rem',
          position: 'absolute',
          'margin-left': '0.4rem'
        }
      });

      removeAttributeButtonSpan = Origo.ui.Element({
        tagName: 'span',
        style: {
          position: 'absolute',
          top: '-4px',
          left: '2px'
        },
        innerHTML: '&times;'
      });

      removeAttributeButton = Origo.ui.Element({
        tagName: 'button',
        cls: 'light rounded-large border text-smaller padding-right-large o-tooltip removeAttributeButton o-hidden',
        style: {
          float: 'right',
          padding: '0.1rem',
          height: '16px',
          width: '16px',
          position: 'relative',
          top: '4px',
          'margin-top': '2px',
          'background-color': '#ffa6a6'
        },
        components: [removeAttributeButtonSpan]
      });

      attributeRow = Origo.ui.Element({
        tagName: 'div',
        cls: 'attributeRow',
        components: [attributeSelect, operatorSelect, filterInput, removeAttributeButton]
      });

      attributeText = Origo.ui.Element({
        tagName: 'p',
        cls: 'text-smaller',
        style: {
          width: '8.6rem',
          'padding-left': '4px'
        },
        innerHTML: 'Attribut'
      });

      operatorText = Origo.ui.Element({
        tagName: 'p',
        cls: 'text-smaller',
        style: {
          width: '5.4rem'
        },
        innerHTML: 'Operator'
      });

      valueText = Origo.ui.Element({
        tagName: 'p',
        cls: 'text-smaller',
        innerHTML: 'Värde'
      });

      attributeTextDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'flex',
        components: [attributeText, operatorText, valueText]
      });

      addAttributeButton = Origo.ui.Button({
        cls: 'light rounded-large border text-smaller padding-right-large o-tooltip',
        style: {
          float: 'left',
          padding: '0.2rem',
          'background-color': '#ebebeb'
        },
        text: 'Lägg till attribut'
      });

      addAttributeDiv = Origo.ui.Element({
        tagName: 'div',
        style: {
          display: 'inline-block'
        },
        components: [addAttributeButton]
      });

      logicFirstText = Origo.ui.Element({
        tagName: 'p',
        style: {
          'line-height': '1.3rem'
        },
        innerHTML: 'Filtrera'
      });

      logicSecondText = Origo.ui.Element({
        tagName: 'p',
        style: {
          'line-height': '1.3rem'
        },
        innerHTML: 'av följande'
      });

      attributeWarningDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'rounded-large text-smaller o-tooltip',
        style: {
          position: 'absolute',
          right: '1rem',
          padding: '0.3rem',
          color: `${warningTextColor}`,
          'background-color': `${warningBackgroundColor}`
        },
        innerHTML: `${warningText}`,
        attributes: {
          title: `${warningTooltipText}`
        }
      });

      logicDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'flex text-smaller',
        components: [logicFirstText, logicSelect, logicSecondText, attributeWarningDiv]
      });

      simpleDiv = Origo.ui.Element({
        tagName: 'div',
        components: [logicDiv, attributeTextDiv, attributeRow, addAttributeDiv]
      });

      advancedText = Origo.ui.Element({
        tagName: 'p',
        cls: 'text-smaller',
        innerHTML: 'Filtersträng:'
      });

      cqlStringTextarea = Origo.ui.Textarea({
        placeholderText: '',
        cls: 'text-smaller width-100'
      });

      advancedDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'o-hidden',
        components: [advancedText, cqlStringTextarea]
      });

      filterContentDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'o-hidden',
        components: [dividerTop, simpleDiv, advancedDiv, dividerBottom, createFilterButton, removeAllFilterButton, removeFilterButton]
      });

      layerText = Origo.ui.Element({
        tagName: 'p',
        cls: 'text-smaller',
        innerHTML: 'Tända lager:'
      });

      filterInnerDiv = Origo.ui.Element({
        tagName: 'div',
        components: [layerText, layerSelect, filterContentDiv]
      });

      myFilterList = Origo.ui.Element({
        tagName: 'ul'
      });

      myFilterDiv = Origo.ui.Element({
        tagName: 'div',
        cls: 'o-hidden',
        components: [myFilterList]
      });

      filterBoxContent = Origo.ui.Element({
        tagName: 'div',
        components: [modeControl, filterInnerDiv, myFilterDiv]
      });

      myFilterRemoveButton = Origo.ui.Button({
        cls: 'icon-smaller small round absolute grey-lightest z-index-top remove-filter',
        style: {
          right: '-0.3rem',
          top: '-0.3rem'
        },
        icon: '#ic_delete_24px',
        ariaLabel: 'Ta bort'
      });

      myFilterEditButton = Origo.ui.Button({
        cls: 'icon-smaller small round absolute grey-lightest z-index-top edit-filter',
        style: {
          right: '1.5rem',
          top: '-0.3rem'
        },
        icon: '#ic_edit_24px',
        ariaLabel: 'Redigera'
      });

      myFilterDisplayButton = Origo.ui.Button({
        cls: 'icon-smaller small round absolute grey-lightest z-index-top display-filter',
        style: {
          right: '3.3rem',
          top: '-0.3rem'
        },
        icon: '#ic_visibility_24px',
        ariaLabel: 'Tänd lager'
      });
    },
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      layers = getVisibleLayers();
      sharemap = viewer.getControlByName('sharemap');
      if (sharemap && sharemap.options.storeMethod === 'saveStateToServer') {
        sharemap.addParamsToGetMapState(name, addToMapState);
      }

      this.addComponents([filterButton]);
      this.render();
      if (viewer.getEmbedded() && (hideButtonWhenEmbedded === true)) {
        document.getElementsByClassName('o-filteretuna')[0].classList.add('hidden');
      }

      if (geoserverUrl) {
        ftlMapper = FtlMapper({ geoserverUrl });
      }

      renderLayerSelect();
      addListenerToLayers();

      viewer.getMap().getLayers().on('add', async () => {
        await handleLayerChanges();
        addListenerToLayers();
      });

      viewer.getMap().getLayers().on('remove', async (event) => {
        await handleLayerChanges();
        addListenerToLayers();
        const layer = event.element;
        if (!layer) return;
        removeFromJson(layer.get('name'));
        setNumberOfLayersWithFilter();
      });

      if (actLikeRadioButton) {
        viewer.on('toggleClickInteraction', (detail) => {
          if (detail.name === 'filter' && detail.active) {
            enableInteraction();
          } else {
            disableInteraction();
          }
        });
      }

      const urlParams = viewer.getUrlParams();
      if (urlParams[name] && urlParams[name].filters.length > 0) {
        filterJson = urlParams[name];
        setSharedFilters();
      }
    },
    render() {
      document.getElementById(target).appendChild(dom.html(filterDiv.render()));
      document.getElementById(filterDiv.getId()).appendChild(dom.html(filterButton.render()));
      document.getElementById(viewer.getMain().getId()).appendChild(dom.html(filterBox.render()));
      document.getElementById(filterBox.getId()).appendChild(dom.html(filterBoxContent.render()));

      document.getElementById(createFilterButton.getId()).addEventListener('click', () => createCqlFilter());
      document.getElementById(removeFilterButton.getId()).addEventListener('click', () => removeCqlFilter());
      document.getElementById(removeAllFilterButton.getId()).addEventListener('click', () => removeAllCqlFilter());
      document.getElementById(addAttributeButton.getId()).addEventListener('click', () => addAttributeRow());
      document.getElementById(simpleModeButton.getId()).addEventListener('click', () => setMode('simple'));
      document.getElementById(advancedModeButton.getId()).addEventListener('click', () => setMode('advanced'));
      document.getElementById(myFilterModeButton.getId()).addEventListener('click', () => setMode('myfilter'));

      window.addEventListener('resize', () => handleOverlapping());

      this.dispatch('render');
    }
  });
};

export default Origofilteretuna;
