
$(document).ready(function() {

	if (typeof FileActions !== 'undefined') {
		FileActions.register('all', 'Restore', OC.PERMISSION_READ, OC.imagePath('core', 'actions/history'), function(filename) {
			var tr=$('tr').filterAttr('data-file', filename);
			var spinner = '<img class="move2trash" title="'+t('files_trashbin', 'perform restore operation')+'" src="'+ OC.imagePath('core', 'loading.gif') +'"></a>';
			var undeleteAction = $('tr').filterAttr('data-file',filename).children("td.date");
			var files = tr.attr('data-file');
			undeleteAction[0].innerHTML = undeleteAction[0].innerHTML+spinner;
			disableActions();
			$.post(OC.filePath('files_trashbin','ajax','undelete.php'),
				{files:JSON.stringify([files]), dirlisting:tr.attr('data-dirlisting') },
				function(result){
					for (var i = 0; i < result.data.success.length; i++) {
						var row = document.getElementById(result.data.success[i].filename);
						row.parentNode.removeChild(row);
					}
					if (result.status !== 'success') {
						OC.dialogs.alert(result.data.message, t('core', 'Error'));
					}
					enableActions();
					FileList.updateFileSummary();
				});

			});
		};

		FileActions.register('all', 'Delete', OC.PERMISSION_READ, function () {
			return OC.imagePath('core', 'actions/delete');
		}, function (filename) {
			$('.tipsy').remove();

			var tr=$('tr').filterAttr('data-file', filename);
			var deleteAction = $('tr').filterAttr('data-file',filename).children("td.date").children(".action.delete");
			var oldHTML = deleteAction[0].outerHTML;
			var newHTML = '<img class="move2trash" data-action="Delete" title="'+t('files', 'delete file permanently')+'" src="'+ OC.imagePath('core', 'loading.gif') +'"></a>';
			var files = tr.attr('data-file');
			deleteAction[0].outerHTML = newHTML;
			disableActions();
			$.post(OC.filePath('files_trashbin','ajax','delete.php'),
				{files:JSON.stringify([files]), dirlisting:tr.attr('data-dirlisting') },
				function(result){
					for (var i = 0; i < result.data.success.length; i++) {
						var row = document.getElementById(result.data.success[i].filename);
						row.parentNode.removeChild(row);
					}
					if (result.status !== 'success') {
						OC.dialogs.alert(result.data.message, t('core', 'Error'));
					}
					enableActions();
					FileList.updateFileSummary();
				});

			});

		// Sets the select_all checkbox behaviour :
		$('#select_all').click(function() {
			if($(this).attr('checked')){
				// Check all
				$('td.filename input:checkbox').attr('checked', true);
				$('td.filename input:checkbox').parent().parent().addClass('selected');
			}else{
				// Uncheck all
				$('td.filename input:checkbox').attr('checked', false);
				$('td.filename input:checkbox').parent().parent().removeClass('selected');
			}
			processSelection();
		});

		$('td.filename input:checkbox').live('change',function(event) {
			if (event.shiftKey) {
				var last = $(lastChecked).parent().parent().prevAll().length;
				var first = $(this).parent().parent().prevAll().length;
				var start = Math.min(first, last);
				var end = Math.max(first, last);
				var rows = $(this).parent().parent().parent().children('tr');
				for (var i = start; i < end; i++) {
					$(rows).each(function(index) {
						if (index === i) {
							var checkbox = $(this).children().children('input:checkbox');
							$(checkbox).attr('checked', 'checked');
							$(checkbox).parent().parent().addClass('selected');
						}
					});
				}
			}
			var selectedCount=$('td.filename input:checkbox:checked').length;
			$(this).parent().parent().toggleClass('selected');
			if(!$(this).attr('checked')){
				$('#select_all').attr('checked',false);
			}else{
				if(selectedCount==$('td.filename input:checkbox').length){
					$('#select_all').attr('checked',true);
				}
			}
			processSelection();
		});

		$('.undelete').click('click',function(event) {
			event.preventDefault();
			var spinner = '<img class="move2trash" title="'+t('files_trashbin', 'perform restore operation')+'" src="'+ OC.imagePath('core', 'loading.gif') +'"></a>';
			var files=getSelectedFiles('file');
			var fileslist = JSON.stringify(files);
			var dirlisting=getSelectedFiles('dirlisting')[0];
			disableActions();
			for (var i=0; i<files.length; i++) {
				var undeleteAction = $('tr').filterAttr('data-file',files[i]).children("td.date");
				undeleteAction[0].innerHTML = undeleteAction[0].innerHTML+spinner;
			}

			$.post(OC.filePath('files_trashbin','ajax','undelete.php'),
					{files:fileslist, dirlisting:dirlisting},
					function(result){
						for (var i = 0; i < result.data.success.length; i++) {
							var row = document.getElementById(result.data.success[i].filename);
							row.parentNode.removeChild(row);
						}
						if (result.status !== 'success') {
							OC.dialogs.alert(result.data.message, t('core', 'Error'));
						}
						enableActions();
					});
			});

		$('.delete').click('click',function(event) {
			event.preventDefault();
			console.log("delete selected");
			var spinner = '<img class="move2trash" title="'+t('files_trashbin', 'Delete permanently')+'" src="'+ OC.imagePath('core', 'loading.gif') +'"></a>';
			var files=getSelectedFiles('file');
			var fileslist = JSON.stringify(files);
			var dirlisting=getSelectedFiles('dirlisting')[0];

			disableActions();
			for (var i=0; i<files.length; i++) {
				var deleteAction = $('tr').filterAttr('data-file',files[i]).children("td.date");
				deleteAction[0].innerHTML = deleteAction[0].innerHTML+spinner;
			}

			$.post(OC.filePath('files_trashbin','ajax','delete.php'),
					{files:fileslist, dirlisting:dirlisting},
					function(result){
						for (var i = 0; i < result.data.success.length; i++) {
							var row = document.getElementById(result.data.success[i].filename);
							row.parentNode.removeChild(row);
						}
						if (result.status !== 'success') {
							OC.dialogs.alert(result.data.message, t('core', 'Error'));
						}
						enableActions();
					});
			});

	$('#fileList').on('click', 'td.filename a', function(event) {
		var mime = $(this).parent().parent().data('mime');
		if (mime !== 'httpd/unix-directory') {
			event.preventDefault();
		}
		var filename = $(this).parent().parent().attr('data-file');
		var tr = $('tr').filterAttr('data-file',filename);
		var renaming = tr.data('renaming');
		if(!renaming && !FileList.isLoading(filename)){
			if(mime.substr(0, 5) === 'text/'){ //no texteditor for now
				return;
			}
			var type = $(this).parent().parent().data('type');
			var permissions = $(this).parent().parent().data('permissions');
			var action = FileActions.getDefault(mime, type, permissions);
			if(action){
				event.preventDefault();
				action(filename);
			}
		}

		// event handlers for breadcrumb items
		$('#controls').delegate('.crumb:not(.home) a', 'click', onClickBreadcrumb);
	});

	FileActions.actions.dir = {
		// only keep 'Open' action for navigation
		'Open': FileActions.actions.dir.Open
	};
});

function processSelection(){
	var selected=getSelectedFiles();
	var selectedFiles=selected.filter(function(el){return el.type === 'file'});
	var selectedFolders=selected.filter(function(el){return el.type === 'dir'});
	if(selectedFiles.length === 0 && selectedFolders.length === 0) {
		$('#headerName>span.name').text(t('files','Name'));
		$('#modified').text(t('files','Deleted'));
		$('table').removeClass('multiselect');
		$('.selectedActions').hide();
	}
	else {
		$('.selectedActions').show();
		var selection='';
		if(selectedFolders.length>0){
			selection += n('files', '%n folder', '%n folders', selectedFolders.length);
			if(selectedFiles.length>0){
				selection+=' & ';
			}
		}
		if(selectedFiles.length>0){
			selection += n('files', '%n file', '%n files', selectedFiles.length);
		}
		$('#headerName>span.name').text(selection);
		$('#modified').text('');
		$('table').addClass('multiselect');
	}
}

/**
 * @brief get a list of selected files
 * @param string property (option) the property of the file requested
 * @return array
 *
 * possible values for property: name, mime, size and type
 * if property is set, an array with that property for each file is returnd
 * if it's ommited an array of objects with all properties is returned
 */
function getSelectedFiles(property){
	var elements=$('td.filename input:checkbox:checked').parent().parent();
	var files=[];
	elements.each(function(i,element){
		var file={
			name:$(element).attr('data-filename'),
			file:$(element).attr('data-file'),
			timestamp:$(element).attr('data-timestamp'),
			type:$(element).attr('data-type'),
			dirlisting:$(element).attr('data-dirlisting')
		};
		if(property){
			files.push(file[property]);
		}else{
			files.push(file);
		}
	});
	return files;
}

function fileDownloadPath(dir, file) {
	return OC.filePath('files_trashbin', '', 'download.php') + '?file='+encodeURIComponent(file);
}

function enableActions() {
	$(".action").css("display", "inline");
	$(":input:checkbox").css("display", "inline");
}

function disableActions() {
	$(".action").css("display", "none");
	$(":input:checkbox").css("display", "none");
}
function onClickBreadcrumb(e){
	var $el = $(e.target).closest('.crumb');
	e.preventDefault();
	FileList.changeDirectory(decodeURIComponent($el.data('dir')));
}

