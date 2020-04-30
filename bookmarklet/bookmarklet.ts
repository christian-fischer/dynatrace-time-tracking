import './bookmarklet.css';

const idCss = 'com_kamilsarelo_dynatrace_timetracking_css';
const idHtml = 'com_kamilsarelo_dynatrace_timetracking_html'; // https://stackoverflow.com/questions/6028211/what-is-the-standard-naming-convention-for-html-css-ids-and-classes/37797488#37797488
const idContent = 'com_kamilsarelo_dynatrace_timetracking_content';
const idHeader = 'com_kamilsarelo_dynatrace_timetracking_header';
const idMain = 'com_kamilsarelo_dynatrace_timetracking_main';
const idInput = 'com_kamilsarelo_dynatrace_timetracking_input';
const idFooter = 'com_kamilsarelo_dynatrace_timetracking_footer';
const idFooterLeft = 'com_kamilsarelo_dynatrace_timetracking_footer_left';
const idFooterRight = 'com_kamilsarelo_dynatrace_timetracking_footer_right';
const idSelectType = 'com_kamilsarelo_dynatrace_timetracking_select_type';
const idButtonBook = 'com_kamilsarelo_dynatrace_timetracking_action_book';
const idButtonClear = 'com_kamilsarelo_dynatrace_timetracking_action_clear';
const idButtonClose = 'com_kamilsarelo_dynatrace_timetracking_action_close';
const idLoader = 'com_kamilsarelo_dynatrace_timetracking_loader';

// caches
const cacheTaskIdAndProjectId = new Map();
const statusOfPreviousLineDone = 'done';

let cacheUserDetailUuid;

interface TimecockpitEntryProperties {
  jiraKey: string;

  APP_BeginTime: string;
  APP_EndTime: string;
  APP_Description: string;
  APP_TaskUuid?: string;
  APP_ProjectUuid?: string;
  APP_UserDetailUuid?: string;
  USR_TimesheetTypeUuid?: string;

  APP_IsDurationTimesheet?: boolean;
  APP_NoBilling?: boolean;
  USR_MedicalConfirmationReceived?: boolean;
}

// time sanity checks
function isInvalidDigit(stringTime: string): boolean {
  return (
    isNaN(+stringTime.charAt(0)) ||
    isNaN(+stringTime.charAt(1)) ||
    isNaN(+stringTime.charAt(3)) ||
    isNaN(+stringTime.charAt(4))
  );
}

function isInvalidHour(integerHour: number): boolean {
  return isNaN(integerHour) || integerHour < 0 || integerHour > 23;
}

function isInvalidMinute(integerMinute: number): boolean {
  return isNaN(integerMinute) || integerMinute < 0 || integerMinute > 59;
}

// clear previous instances
function clear() {
  // or:  const clear = function() {
  [idHtml, idCss].forEach((id) => {
    document.querySelectorAll('#' + id).forEach((element) => {
      element.parentNode.removeChild(element); //https://stackoverflow.com/questions/8830839/javascript-dom-remove-element/8830882
    });
  });
}

function createContent() {
  clear();

  // or: function loadCss() { | const loadCss = function() {
  new Promise((resolve) => {
    // https://stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript/51183077#51183077

    // CSS
    const link = document.createElement('link');
    link.id = idCss;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    // link.href = 'https://localhost/bookmarklet.css';
    // link.href = 'https://cdn.jsdelivr.net/gh/kamilsarelo/timetracking/bookmarklet/bookmarklet.css';
    link.href =
      'https://christian-fischer.github.io/com.dynatrace.timetracking.bookmarklet.css?q=' +
      new Date().getTime();
    link.media = 'all';
    link.onload = () => {
      // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onload and https://stackoverflow.com/questions/6348494/addeventlistener-vs-onclick/6348533#6348533
      resolve();
    };
    document.head.appendChild(link); // https://developer.mozilla.org/de/docs/Web/API/Document/head
  }).then(() => {
    // or: // loadCss().then(() => {

    // HTML
    const dummy = document.createElement('dummy');
    dummy.innerHTML = `
					<div id="${idHtml}">
						<div id="${idContent}">
							<div id="${idHeader}">
								<select id="${idSelectType}" class="filament-select-css">
									<option value="cd4f750b-85f8-41f8-b193-9c82e23f82eb" selected="selected">Office</option>
									<option value="0ad94cf7-955c-45dc-b49e-20be0f449b75">Home Office</option>
								</select>
							</div>
							<div id="${idMain}">
								<div id="${idInput}" contenteditable="true">
									&#xfeff;
								</div>
								<div id="${idLoader}">
									<div class="spin-wrapper">
										<div class="spinner">
										</div>
									</div>
								</div>
							</div>
							<div id="${idFooter}">
								<button id="${idButtonBook}" class="pure-material-button-contained">Book</button>
								<button id="${idButtonClear}" class="pure-material-button-outlined">Clear</button>
								<button id="${idButtonClose}" class="pure-material-button-outlined">Close</button>
							</div>
						</div>
					</div>`;
    document.body.appendChild(dummy.querySelector('div'));

    setTimeout(() => {
      // must be deferred, https://stackoverflow.com/questions/18509507/why-use-settimeout-in-deferred
      document.getElementById(idInput).focus();
    }, 0);

    // document.getElementById(idInput).addEventListener('paste', (e) => { // https://stackoverflow.com/questions/21257688/paste-rich-text-into-content-editable-div-and-only-keep-bold-and-italics-formatt
    // 	e.preventDefault();
    // 	const clipboardData = e.clipboardData;
    // 	const dataText = clipboardData.getData('text/plain');
    // 	if (dataText && dataText.trim().length != 0) {
    // 		document.getElementById(idInput).innerText = dataText;
    // 		return false; // prevent returning text in clipboard
    // 	}
    // }, false);
    //
    // ...this is good, but the following is better...
    //
    document.getElementById(idInput).addEventListener('paste', (e) => {
      // https://stackoverflow.com/questions/12027137/javascript-trick-for-paste-as-plain-text-in-execcommand/19327995#19327995
      e.preventDefault();
      const content = ((e as any).originalEvent || e).clipboardData.getData(
        'text/plain',
      );
      document.execCommand('insertText', false, content);
    });

    document.getElementById(idButtonBook).onclick = () => {
      const input = document.getElementById(idInput);

      // remove all html except line breaks
      input.querySelectorAll('span').forEach((span) => {
        // also: ... .forEach(span => { ...
        input.removeChild(span);
      });

      const string = input.innerText; // or https://developer.mozilla.org/de/docs/Web/API/Node/textContent but textContent ignores line breaks
      if (string.trim().length === 0) {
        return;
      }

      function setEnabled(isEnabled) {
        [idButtonBook, idButtonClear, idButtonClose].forEach((id) => {
          (document.getElementById(id) as any).disabled = !isEnabled;
        });
        input.contentEditable = isEnabled;
        input.focus();
        document.getElementById(idLoader).style.visibility = isEnabled
          ? 'hidden'
          : 'visible';
      }
      setEnabled(false);

      const selectType = document.getElementById(idSelectType);
      const timesheetTypeUuid = (selectType as any).options[
        (selectType as any).selectedIndex
      ].value;

      input.innerHTML = '';
      let linePrevious;

      const lineArray = string.split(/\r\n|\r|\n/g); // also string.split(/\r?\n/g); but mind: https://stackoverflow.com/questions/21711768/split-string-in-javascript-and-detect-line-break/21712066#21712066
      // lineArray.forEach((line) => { ...
      // the whole booking process has to be done sequential via synchronous xhr (xhr is parallel/async by default),
      // so caches can work, AND most importantly no duplicate entities are created
      // but synchronous xhr should be used in workers exclusively: https://xhr.spec.whatwg.org/#synchronous-flag
      // ...thus forEach cannot be used
      //
      // "Synchronous XMLHttpRequest outside of workers is in the process of being removed from the web platform
      // as it has detrimental effects to the end user’s experience. (This is a long process that takes many years.)
      // Developers must not pass false for the async argument when current global object is a Window object.
      // User agents are strongly encouraged to warn about such usage in developer tools
      // and may experiment with throwing an "InvalidAccessError" DOMException when it occurs."
      //
      // ...thus let's simulate synchronours xhr with a mutex callback... https://www.mkyong.com/java/java-thread-mutex-and-semaphore-example/
      const synchronizedLineProcessor = (
        statusOfPreviousLine?: string,
      ): void => {
        if (linePrevious) {
          input.innerHTML =
            (input.innerHTML ? input.innerHTML + '<br>' : '') +
            (statusOfPreviousLine
              ? '<span class="pill" style="background-color: ' +
                (statusOfPreviousLine === statusOfPreviousLineDone
                  ? 'green'
                  : 'red') +
                ';">' +
                statusOfPreviousLine +
                '</span>'
              : '') +
            linePrevious;
          input.scrollTop = input.scrollHeight; // https://stackoverflow.com/questions/40495860/how-to-scroll-to-automatically-scroll-to-the-bottom-of-an-editable-div-onload/40506676#40506676
        }
        if (lineArray.length > 0) {
          linePrevious = lineArray.shift(); // https://love2dev.com/blog/javascript-remove-from-array/
          checkLineAndParseProperties(
            linePrevious,
            timesheetTypeUuid,
            synchronizedLineProcessor,
          ); // first step, forwards to consecutive steps
        } else {
          setEnabled(true);
          const refreshButton = document.querySelector(
            'button[ng-click="refresh()"]',
          );
          if (refreshButton) {
            (refreshButton as any).click();
          }
        }
      };
      setTimeout(() => {
        // must be deferred
        synchronizedLineProcessor();
      }, 0);
    };

    document.getElementById(idButtonClear).onclick = () => {
      // https://stackoverflow.com/questions/6348494/addeventlistener-vs-onclick
      const input = document.getElementById(idInput);
      input.innerHTML = ''; // https://stackoverflow.com/questions/3450593/how-do-i-clear-the-content-of-a-div-using-javascript
      input.focus();
    };

    document.getElementById(idButtonClose).onclick = () => {
      clear();
    };

    document.onkeydown = (event: any) => {
      event = event || window.event;
      if (event.keyCode == 27) {
        // ESC key
        clear();
        document.onkeydown = undefined; // deregister
      }
    };

    window['COM_KAMILSARELO_DYNATRACE_TIMETRACKING_FORK_RUNNING'] = false;
  });
}

function checkLineAndParseProperties(
  line: string,
  timesheetTypeUuid: string,
  callback: (statusOfPreviousLine?: string) => void,
) {
  line = line.trim();
  if (!line) {
    callback(); // no error on empty line
    return;
  }

  function computeProperties(
    line: string,
  ): TimecockpitEntryProperties | undefined {
    // basic sanity checks:
    // 2019-03-11|12:00|16:00|...|...
    // 0123456789 123456789 123456789
    if (
      line.length <= 23 || // first 23 characters are fixed width: date, time, time
      isNaN(+line.charAt(0)) || // first character must be a number: https://stackoverflow.com/questions/8935632/check-if-character-is-number
      '|' !== line.charAt(10) ||
      '|' !== line.charAt(16) ||
      '|' !== line.charAt(22)
    ) {
      return;
    }

    // date and times
    const stringDate = line.substr(0, 10); // https://www.w3schools.com/jsref/jsref_obj_string.asp
    const stringTimeBegin = line.substr(11, 5);
    const stringTimeEnd = line.substr(17, 5);
    // Jira key
    const indexOfPipe = line.indexOf('|', 23);
    if (indexOfPipe === -1) {
      // no delimiter after Jira key
      return;
    }
    const stringJiraKey = line.substring(23, indexOfPipe); // https://stackoverflow.com/questions/2243824/what-is-the-difference-between-string-slice-and-string-substring
    if (stringJiraKey === '') {
      return;
    }
    // comment
    const stringComment = line.substr(indexOfPipe + 1);
    if (stringComment === '') {
      // empty comment
      return;
    }

    // ---

    // date sanity checks
    // valid delimiters
    if ('-' !== stringDate.charAt(4) || '-' !== stringDate.charAt(7)) {
      return;
    }
    // valid digits: https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
    if (
      isNaN(+stringDate.charAt(0)) ||
      isNaN(+stringDate.charAt(1)) ||
      isNaN(+stringDate.charAt(2)) ||
      isNaN(+stringDate.charAt(3)) ||
      isNaN(+stringDate.charAt(5)) ||
      isNaN(+stringDate.charAt(6)) ||
      isNaN(+stringDate.charAt(8)) ||
      isNaN(+stringDate.charAt(9))
    ) {
      return;
    }
    // valid year
    const integerYearCurrent = new Date().getFullYear();
    const integerYear = parseInt(stringDate.substr(0, 4), 10);
    // if (isNaN(integerYear) || integerYear < 2019 || integerYear > 2046) {
    if (
      isNaN(integerYear) ||
      integerYear < integerYearCurrent ||
      integerYear > integerYearCurrent
    ) {
      return;
    }
    // valid month
    const integerMonth = parseInt(stringDate.substr(5, 2), 10);
    if (isNaN(integerYear) || integerMonth < 1 || integerMonth > 12) {
      return;
    }
    // valid day
    const integerDay = parseInt(stringDate.substr(8, 2), 10);
    if (isNaN(integerYear) || integerDay < 1 || integerDay > 31) {
      return;
    }
    // valid date
    if (
      (() => {
        const date = new Date();
        date.setFullYear(integerYear, integerMonth - 1, integerDay);
        return (
          date.getFullYear() !== integerYear ||
          date.getMonth() !== integerMonth - 1 ||
          date.getDate() !== integerDay
        ); // https://ctrlq.org/code/20109-javascript-date-valid
      })()
    ) {
      return;
    }

    // ---

    // valid delimiters
    if (':' !== stringTimeBegin.charAt(2) || ':' !== stringTimeEnd.charAt(2)) {
      return;
    }
    // valid digits
    if (isInvalidDigit(stringTimeBegin) || isInvalidDigit(stringTimeEnd)) {
      return;
    }
    // valid hours
    const integerHourBegin = parseInt(stringTimeBegin.substr(0, 2), 10);
    const integerHourEnd = parseInt(stringTimeEnd.substr(0, 2), 10);
    if (isInvalidHour(integerHourBegin) || isInvalidHour(integerHourEnd)) {
      return;
    }
    // valid minutes
    const integerMinuteBegin = parseInt(stringTimeBegin.substr(3, 2), 10);
    const integerMinuteEnd = parseInt(stringTimeEnd.substr(3, 2), 10);
    if (
      isInvalidMinute(integerMinuteBegin) ||
      isInvalidMinute(integerMinuteEnd)
    ) {
      return;
    }
    // begin actually before end
    if (
      integerHourBegin > integerHourEnd ||
      (integerHourBegin === integerHourEnd &&
        integerMinuteBegin >= integerMinuteEnd)
    ) {
      return;
    }

    // ---

    const APP_BeginTime = stringDate + 'T' + stringTimeBegin + ':00';
    const APP_EndTime = stringDate + 'T' + stringTimeEnd + ':00';
    // const APP_Description = encodeURIComponent(stringComment); // encoding not necessary, https://stackoverflow.com/questions/332872/encode-url-in-javascript/6171234#6171234
    const APP_Description = stringComment;

    return {
      // https://stackoverflow.com/questions/12272239/javascript-function-returning-an-object
      jiraKey: stringJiraKey,
      APP_BeginTime: APP_BeginTime,
      APP_EndTime: APP_EndTime,
      APP_Description: APP_Description,
    };
  }

  const properties = computeProperties(line);

  if (properties !== undefined) {
    properties.USR_TimesheetTypeUuid = timesheetTypeUuid;
    queryUserId(properties, callback);
  } else {
    callback('invalid');
  }
}

function queryUserId(
  properties: TimecockpitEntryProperties,
  callback: (statusOfPreviousLine?: string) => void,
) {
  function nextStep() {
    properties.APP_UserDetailUuid = cacheUserDetailUuid;
    checkIfEntityWithEqualBeginOrEndTimeAlreadyExists(properties, callback);
  }

  if (cacheUserDetailUuid) {
    nextStep(); // not deferred, because async xhr starts immediately in next step
    return; // avoid running callback too early
  }

  xhrGet('/shell/user')
    .then((response: string) => {
      const json = JSON.parse(response);

      if (json) {
        if (json.useruuid) {
          cacheUserDetailUuid = json.useruuid;
          nextStep();
          return; // avoid running callback too early
        } else {
          console.log('ERROR: no useruuid available');
        }
      } else {
        console.log('ERROR: on JSON.parse() in queryUserId()');
      }
      callback('error');
    })
    .catch((error) => {
      console.log('ERROR: in queryUserId()', error);
      callback(error.status || 'error');
    });
}

function checkIfEntityWithEqualBeginOrEndTimeAlreadyExists(
  properties: TimecockpitEntryProperties,
  callback: (statusOfPreviousLine?: string) => void,
) {
  xhrGet(
    '/odata/APP_Timesheet' +
      "?$filter=(APP_BeginTime eq datetime'" +
      properties.APP_BeginTime +
      "'" +
      " or APP_EndTime eq datetime'" +
      properties.APP_EndTime +
      "')" +
      " and APP_UserDetailUuid eq guid'" +
      properties.APP_UserDetailUuid +
      "'",
  )
    .then((response) => {
      const json = JSON.parse(response);

      if (json && json.value) {
        if (json.value.length > 0) {
          console.log(
            'ERROR: APP_Timesheet entity with equal start- (' +
              properties.APP_BeginTime +
              ') and/or end-time (' +
              properties.APP_EndTime +
              ') exists',
          );
          callback('exists');
          return;
        } else {
          queryTaskIdAndProjectIdForJiraKey(properties, callback);
          return; // avoid running callback too early
        }
      } else {
        console.log(
          'ERROR: on JSON.parse() in checkIfEntityWithEqualBeginOrEndTimeAlreadyExists()',
        );
      }
      callback('error');
    })
    .catch((error) => {
      console.log(
        'ERROR: in checkIfEntityWithEqualBeginOrEndTimeAlreadyExists()',
        error,
      );
      callback(error.status || 'error');
    });
}

function queryTaskIdAndProjectIdForJiraKey(
  properties: TimecockpitEntryProperties,
  callback: (statusOfPreviousLine?: string) => void,
) {
  function nextStep() {
    const cache = cacheTaskIdAndProjectId.get(properties.jiraKey);
    properties.APP_TaskUuid = cache.APP_TaskUuid;
    properties.APP_ProjectUuid = cache.APP_ProjectUuid;

    createEntity(properties, callback);
  }
  if (cacheTaskIdAndProjectId.has(properties.jiraKey)) {
    nextStep(); // not deferred, because async xhr starts immediately in next step
    return; // avoid running callback too early
  }
  xhrGet(
    '/odata/APP_Task' +
      "?$filter=APP_Code eq '" +
      properties.jiraKey +
      "'" +
      '&$select=APP_TaskUuid,APP_ProjectUuid',
  )
    .then((response) => {
      const json = JSON.parse(response); // https://stackoverflow.com/questions/33169315/json-parse-selecting-from-a-select-container
      if (json && json.value) {
        if (json.value.length > 0) {
          cacheTaskIdAndProjectId.set(properties.jiraKey, {
            APP_TaskUuid: json.value[0].APP_TaskUuid,
            APP_ProjectUuid: json.value[0].APP_ProjectUuid,
          });
          nextStep();
          return; // avoid running callback too early
        } else {
          console.log(
            'ERROR: no APP_Task entity for specified Jira key (' +
              properties.jiraKey +
              ') available',
          );
        }
      } else {
        console.log(
          'ERROR: on JSON.parse() in queryTaskIdAndProjectIdForJiraKey()',
        );
      }
      callback('error');
    })
    .catch((error) => {
      console.log('ERROR: in queryTaskIdAndProjectIdForJiraKey()', error);
      callback(error.status || 'error');
    });
}

function createEntity(
  properties: TimecockpitEntryProperties,
  callback: (statusOfPreviousLine?: string) => void,
) {
  const json = JSON.stringify({
    // 'APP_TimesheetUuid': https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
    APP_BeginTime: properties.APP_BeginTime,
    APP_EndTime: properties.APP_EndTime,
    APP_Description: properties.APP_Description,
    APP_TaskUuid: properties.APP_TaskUuid,
    APP_ProjectUuid: properties.APP_ProjectUuid,
    APP_UserDetailUuid: properties.APP_UserDetailUuid,
    USR_TimesheetTypeUuid: properties.USR_TimesheetTypeUuid,
    // 'APP_IsDurationTimesheet': false,
    // 'APP_NoBilling': false,
    // 'USR_MedicalConfirmationReceived': false
  });

  xhrPost('/odata/APP_Timesheet', json)
    .then(() => {
      callback(statusOfPreviousLineDone);
    })
    .catch((error) => {
      console.log('ERROR: in createEntity()', error);
      callback(error.status || 'error');
    });
}

function deleteEntity(APP_TimesheetUuid) {
  xhrDelete("/odata/APP_Timesheet(guid'" + APP_TimesheetUuid + "')")
    .then((response) => {
      console.log(
        'deleted APP_Timesheet entity with UUID: ' + APP_TimesheetUuid,
      );
    })
    .catch((error) => {
      console.log('ERROR: in deleteEntity()', error);
    });
}

function xhrGet(url: string): Promise<string> {
  return xhr(url);
}

function xhrPost(url: string, json?: any): Promise<string> {
  return xhr(url, 'POST', json);
}

function xhrDelete(url: string): Promise<string> {
  return xhr(url, 'DELETE');
}

function xhr(url: string, method?: string, json?: any): Promise<string> {
  const request = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    request.onreadystatechange = () => {
      if (request.readyState !== 4) return; // 4 is DONE, https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText);
      } else {
        reject({
          status: request.status,
          statusText: request.statusText,
        });
      }
    };
    request.open(method || 'GET', url, true);
    request.setRequestHeader('cache-control', 'no-cache'); // https://stackoverflow.com/a/48969579
    request.setRequestHeader('cache-control', 'max-age=0');
    request.setRequestHeader('pragma', 'no-cache');
    if (method === 'POST') {
      // if (json) {
      request.setRequestHeader(
        'Content-Type',
        'application/json; charset=utf-8',
      );
      request.send(json);
    } else {
      request.send();
    }
  });
}

// RUN BOOKMARKLET
(() => {
  // console.clear();

  if (window['COM_KAMILSARELO_DYNATRACE_TIMETRACKING_FORK_RUNNING']) {
    console.log('ERROR: bookmarklet is already running');
    return; // https://stackoverflow.com/questions/550574/how-to-terminate-the-script-in-javascript
  }
  window['COM_KAMILSARELO_DYNATRACE_TIMETRACKING_FORK_RUNNING'] = true; // global scope var, https://stackoverflow.com/questions/9521298/verify-external-script-is-loaded

  console.log('bookmarklet called');

  const url = 'https://dynatrace.timecockpit.com';

  if (window.location.origin !== url) {
    const dummy = document.createElement('dummy');
    dummy.innerHTML = `
			<div style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 999; background-color: rgba(0, 0, 0, 0.66); display: grid;">
				<div style="margin: auto; padding: 24px; box-sizing: border-box; font-size: 24px; background-color: yellow; border-radius: 4px; font-family: Roboto, 'Segoe UI', BlinkMacSystemFont, system-ui, -apple-system, Arial, Helvetica, sans-serif;">
					...redirecting to ' + url + '. Run the bookmarklet again after the site loaded.
				</div>
			</div>`;
    document.body.appendChild(dummy.querySelector('div')); // https://developer.mozilla.org/de/docs/Web/API/Document/body and https://stackoverflow.com/questions/9614932/best-way-to-create-large-static-dom-elements-in-javascript

    window.setTimeout(() => {
      // https://stackoverflow.com/questions/18048338/how-can-i-execute-a-script-after-calling-window-location-href
      // window.onload = () => { ... cannot be performed after the redirect
      window.location.href = url;
    }, 1000);
  } else {
    if (document.readyState && document.readyState === 'complete') {
      createContent();
    } else {
      window['COM_KAMILSARELO_DYNATRACE_TIMETRACKING_FORK_RUNNING'] = false;
    }
  }
})();
