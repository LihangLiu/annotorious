goog.provide('annotorious.modules.image.ImageAnnotator');

goog.require('goog.soy');
goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.style');

/**
 * The ImageAnnotator is responsible for handling annotation functionality
 * on one image in the page.
 * @param {element} image the image DOM element
 * @constructor
 */
annotorious.modules.image.ImageAnnotator = function(image) {
  /** @private **/
  this._image = image;
  
  /** @private **/
  this._eventBroker = new annotorious.events.EventBroker(this);
  
  var annotationLayer = goog.dom.createDom('div', 'yuma-annotationlayer');
  goog.style.setStyle(annotationLayer, 'position', 'relative');
  goog.style.setSize(annotationLayer, image.width, image.height); 
  goog.dom.replaceNode(annotationLayer, image);
  goog.dom.appendChild(annotationLayer, image);
    
  var hint = goog.soy.renderAsElement(annotorious.templates.image.hint, {msg:'Click and Drag to Annotate'});
  goog.style.setOpacity(hint, 0); 
  goog.dom.appendChild(annotationLayer, hint);
  
  var viewCanvas = goog.soy.renderAsElement(annotorious.templates.image.canvas,
    { width:image.width, height:image.height });
  goog.dom.appendChild(annotationLayer, viewCanvas);   

  /** @private **/
  this._editCanvas = goog.soy.renderAsElement(annotorious.templates.image.canvas, 
    { width:image.width, height:image.height });
  goog.style.showElement(this._editCanvas, false); 
  goog.dom.appendChild(annotationLayer, this._editCanvas);  

  var self = this;  
  goog.events.listen(annotationLayer, goog.events.EventType.MOUSEOVER, function() { 
    self._eventBroker.fireEvent(annotorious.events.EventType.MOUSE_OVER_ANNOTATABLE_MEDIA);
    goog.style.setOpacity(viewCanvas, 1.0); 
    goog.style.setOpacity(hint, 0.8); 
  });
  
  goog.events.listen(annotationLayer, goog.events.EventType.MOUSEOUT, function() { 
    self._eventBroker.fireEvent(annotorious.events.EventType.MOUSE_OUT_OF_ANNOTATABLE_MEDIA);
    goog.style.setOpacity(viewCanvas, 0.4); 
    goog.style.setOpacity(hint, 0);
  });
 
  /** @private **/
  this._viewer = new annotorious.modules.image.Viewer(viewCanvas, new annotorious.viewer.Popup(annotationLayer, this), this);
  
  /** @private **/
  this._selector = new annotorious.selection.DragSelector(this._editCanvas, this);

  goog.events.listen(viewCanvas, goog.events.EventType.MOUSEDOWN, function(event) {
    goog.style.showElement(self._editCanvas, true);
    self._selector.startSelection(event.offsetX, event.offsetY);
  });

  this._eventBroker.addHandler(annotorious.events.EventType.SELECTION_COMPLETED, function(event) {
    var shape = event.shape;
    var editor = new annotorious.editor.Editor(self._selector, self, annotationLayer,
                                        shape.geometry.x + self._image.offsetLeft,
                                        shape.geometry.y + shape.geometry.height + 4 + self._image.offsetTop);
  });
  
  this._eventBroker.addHandler(annotorious.events.EventType.ANNOTATION_EDIT_CANCEL, function(event) {
    goog.style.showElement(self._editCanvas, false);
    self._selector.stopSelection();
  });

  this._eventBroker.addHandler(annotorious.events.EventType.ANNOTATION_EDIT_SAVE, function(event) {
   goog.style.showElement(self._editCanvas, false);
   self._selector.stopSelection();
   self._viewer.addAnnotation(event.annotation);
  });
  
  this._eventBroker.addHandler(annotorious.events.EventType.POPUP_BTN_DELETE, function(event) {
    self._viewer.removeAnnotation(event.annotation);
  });
}

/**
 * Returns the image that this annotator is responsible for.
 * @returns {element} the image
 */
annotorious.modules.image.ImageAnnotator.prototype.getImage = function() {
  return this._image;
}

/**
 * Adds a lifecycle event handler to this annotator's Event Broker.
 * @param {yuma.events.EventType} type the event type
 * @param {function} the handler function
 */
annotorious.modules.image.ImageAnnotator.prototype.addHandler = function(type, handler) {
  this._eventBroker.addHandler(type, handler);  
}

/**
 * Fire an event on this annotator's Event Broker.
 * @param {yuma.events.EventType} type the event type
 * @param {Object} the event object
 */
annotorious.modules.image.ImageAnnotator.prototype.fireEvent = function(type, event) {
  this._eventBroker.fireEvent(type, event);
}

/**
 * Adds annotation to this annotator's viewer.
 * @param {yuma.annotation.Annotation} annotation the annotation
 */
annotorious.modules.image.ImageAnnotator.prototype.addAnnotation = function(annotation) {
  this._viewer.addAnnotation(annotation);
}

/**
 * Removes an annotation from this annotator's viewer.
 * @param {yuma.annotation.Annotation} annotation the annotation
 */
annotorious.modules.image.ImageAnnotator.prototype.removeAnnotation = function(annotation) {
  this._viewer.removeAnnotation(annotation);
}
