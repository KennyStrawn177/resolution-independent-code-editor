// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Callbacks for the controller
// The delegate can implement those methods.

var FilesListViewControllerDelegate = function() {
}

FilesListViewControllerDelegate.prototype.filesListViewControllerSelectionChanged = function(entries) {
  // Do nothing.
}

FilesListViewControllerDelegate.prototype.filesListViewControllerDoubleClicked = function(entries) {
  // Do nothing.
}

FilesListViewControllerDelegate.prototype.filesListViewControllerShowContextMenuForElement = function(element) {
  // Do nothing.
}

// Here's starting the actual implementation of the controller.

var FilesListViewController = function(element, delegate) {
  this.entries = null;
  this.entriesHash = new Object();
  this.childrenCache = new Object();
  this.treeView = new TreeView(element, this);
  this.treeView.reloadData();
  this.delegate = delegate;
  element.keydown(this.keyDown.bind(this));
  
  window.addEventListener("FileNodeTreeUpdated", this.onFileNodeTreeUpdated.bind(this));
}

FilesListViewController.prototype.keyDown = function(e) {
  if (e.keyCode == 8) {
    e.preventDefault();
    $('#RemoveFilesModal').modal('show');
  }
}

FilesListViewController.prototype.updateRoot = function(activeProject) {
  this.root = activeProject;
  this.childrenCache = new Object();
  this.treeView.reloadData();
}

FilesListViewController.prototype.setSelection = function(selectedEntriesPaths) {
  var selectedNodeUIDs = new Array();
  selectedEntriesPaths.forEach(function(entry, i) {
    selectedNodeUIDs.push(entry.name);
  });
  this.treeView.setSelectedNodesUIDs(selectedNodeUIDs);
}

FilesListViewController.prototype.setSelectionByNames = function(names) {
  this.treeView.setSelectedNodesUIDs(names);
}

FilesListViewController.prototype.selection = function() {
  var result = [];
  this.treeView.selectedNodesUIDs().forEach(function(nodeUID, i) {
    result.push(fileEntryMap[nodeUID].entry);
  });
  console.log('selection: ' + result);
  console.log(result);
  return result;
}

// Implements TreeViewDelegate

FilesListViewController.prototype.treeViewExists = function(nodeUID) {
  var node = null;
  if (nodeUID == null) {
    node = this.root;
  } else {
    node = fileEntryMap[nodeUID];
  }
  if (node == null)
    return false;
  
  return true;
}

FilesListViewController.prototype.treeViewHasChildren = function(nodeUID) {
  var node = null;
  if (nodeUID == null) {
    node = this.root;
  } else {
    node = fileEntryMap[nodeUID];
  }
  if (node == null)
    return false;
  
  return Object.keys(node.children).length > 0;
}

FilesListViewController.prototype.treeViewNumberOfChildren = function(nodeUID) {
  var node = null;
  if (nodeUID == null) {
    node = this.root;
  } else {
    node = fileEntryMap[nodeUID];
  }
  if (node == null)
    return 0;

  var children = this.cachedChildrenForNode(node);
  return children.length;
}

FilesListViewController.prototype.cachedChildrenForNode = function(fileNode) {
  var children = this.childrenCache[fileNode.entry.fullPath];
  if (children != null) {
    return children;
  }
  
  children = [];
  Object.keys(fileNode.children).forEach(function(childPath, i) {
    if (fileEntryMap[childPath].entry.name == '.git')
      return;
    children.push(childPath);
  });
  children.sort(function(a,b) {
    if (a.toLowerCase() < b.toLowerCase())
      return -1;
    else if (a.toLowerCase() > b.toLowerCase())
      return 1;
    else
      return 0;
  });
  this.childrenCache[fileNode.entry.fullPath] = children;
  
  return children;
}

FilesListViewController.prototype.treeViewChild = function(nodeUID, childIndex) {
  var node = null;
  if (nodeUID == null) {
    node = this.root;
  } else {
    node = fileEntryMap[nodeUID];
  }
  if (node == null)
    return null;
  
  var children = this.cachedChildrenForNode(node);
  return children[childIndex];
}

FilesListViewController.prototype.treeViewElementForNode = function(nodeUID) {
  var node = fileEntryMap[nodeUID];
  var fileicon;
  if (node.isDirectory) {
    fileicon = $('<img src="img/file-regular.png" class="folder-icon"/>');
  } else {
    fileicon = $('<img src="img/file-regular.png"/>');
  }
  var text = $('<span class="file-item-text">' + htmlEncode(node.entry.name) + '</span>');
  var caret = $('<span class="caret"></span>');
  var dropdown = $('<div></div>');
  var link = $('<a href="#"></a>');
  link.append(caret);
  dropdown.append(link);

  var listitem =  $("<div class=\"file-item\"></div>");
  listitem.append(fileicon);
  listitem.append(text);
  listitem.append(dropdown);
  
  link.click(function(e) {
    if ($('#files-menu').css('display') == 'block') {
      return;
    }
    
    console.log('click link');
    // Select item if not selected.
    var isSelected = false;
    this.treeView.selectedNodesUIDs().forEach(function(currentNodeUID, i) {
      if (currentNodeUID == nodeUID) {
        isSelected = true;
      }
    });
    if (!isSelected) {
      this.treeView.setSelectedNodeUID(nodeUID);
    }
    
    this.delegate.filesListViewControllerShowContextMenuForElement(link, e);
  }.bind(this));
  
  return listitem;
}

FilesListViewController.prototype.treeViewHeightForNode = function(nodeUID) {
  return 25.;
}

FilesListViewController.prototype.treeViewSelectionChanged = function(nodesUIDs) {
  // Do nothing.
  this.delegate.filesListViewControllerSelectionChanged(this.selection());
}

FilesListViewController.prototype.treeViewDoubleClicked = function(nodesUIDs) {
  this.delegate.filesListViewControllerDoubleClicked(this.selection());
}

FilesListViewController.prototype.onFileNodeTreeUpdated = function(event) {
  var path = event.detail.path;
  if (this.root == null)
    return;

  //console.log("updated path " + path);
  // Update view only if updates files are in the scope of displayed files.
  if ((path + '/').indexOf(this.root.entry.fullPath + '/') != 0)
    return;
  //console.log("update tree " + this.root);

  this.childrenCache = new Object();
  this.treeView.reloadData();
}
