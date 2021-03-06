import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { TranslateService } from 'ng2-translate';

import { TopicService } from '../shared/topic.service';
import { UserService } from '../../users/user.service';
import { User } from '../../users/user.model';
import { OOApiService } from '../../shared/api/oo-api.service';
import { ConfigService } from '../../config.service';

declare let window: {
  angularComponentRef: any,
  DocsAPI: any
};

const DocsAPI = window.DocsAPI;

function onRequestHistory() {
  window.angularComponentRef.zone.run(() => {
      window.angularComponentRef.onRequestHistory();
    }
  );
}

function onRequestChangeHistoryData(data: any) {
  window.angularComponentRef.zone.run(() => {
      window.angularComponentRef.onRequestChangeHistoryData(data);
    }
  );
}

function onRequestHistoryClose() {
  window.angularComponentRef.zone.run(() => {
      window.angularComponentRef.onRequestHistoryClose();
    }
  );
}

@Component({
  selector: 'hip-content',
  template: `
  <div class="form" style="margin: 0;padding: 0;height: 100%;">
    <div id="iframeEditor">
      <p style="margin: 20px" *ngIf="toWait > 0">{{ 'please wait x seconds' | translate: {seconds: toWait} }}</p>
    </div>
  </div>
`
})
export class ContentComponent implements OnDestroy, OnInit {
  private currentUser: User;
  private topicId: number;

  toWait = -1;
  apiUrl = '';
  public config = {
    apiUrl: '',
    editor: {
      callbackUrl: '',
      canBackToFolder: false,
      curUserHostAddress: '',
      documentType: '',
      fileChoiceUrl: '',
      firstName: '',
      getServerUrl: '',
      isEdit: false,
      key: '',
      lang: '',
      lastName: '',
      mode: '',
      plugins: {},
      type: '',
      userid: '',
    },
    file: {
      ext: '',
      name: '',
      uri: '',
      version: 0,
    },
    history: [{}],
    setHistoryData: {
      url: '',
      urlDiff: ''
    }
  };
  loaded = true;
  count = 0;

  private docEditor: any = {};

  constructor(private route: ActivatedRoute,
              private router: Router,
              private topicService: TopicService,
              private userService: UserService,
              private toasterService: ToasterService,
              private translateService: TranslateService,
              private ooApiService: OOApiService,
              private ngZone: NgZone,
              private configService: ConfigService) {
    window.angularComponentRef = {
      zone: this.ngZone,
      component: this,
      onRequestHistory: () => this.onRequestHistory(),
      onRequestChangeHistoryData: (data: any) => this.onRequestChangeHistoryData(data),
      onRequestHistoryClose: () => this.onRequestHistoryClose()
    };
  }

  ngOnInit() {
    this.topicId = this.route.snapshot.params['id'];
    this.topicService.getTopic(this.topicId)
      .catch(
        () => {
          this.router.navigate(['/error']);
        }
      );

    // The Only Office Editor needs 10 seconds after closing until the changes are saved.
    let lastEdited = +localStorage.getItem('document-' + this.topicId);
    let timeToWait = lastEdited + 10000 - new Date().valueOf();
    this.toWait = Math.round(timeToWait / 1000);
    if (timeToWait < 0) {
      this.prepareEditor();
    } else {
      setTimeout(() => this.prepareEditor(), timeToWait);
    }

    // fetch current user and check permissions
    this.userService.getCurrent()
      .then(
        (response: any) => {
          this.currentUser = <User> response;
        }
      ).catch(
        (error: any) => this.toasterService.pop('error', 'Error fetching current user', error)
      );
  }

  ngOnDestroy() {
    window.angularComponentRef = null;
    localStorage.setItem('document-' + this.topicId, new Date().valueOf().toString());
  }

  prepareEditor() {
    this.ooApiService.getUrl('/topic/' + this.topicId + '/exists', {}).toPromise()
      .then(
        (response: any) =>  this.loadOnlyOffice()
      ).catch(
      () => {
        this.ooApiService.postUrl('/topic', JSON.stringify({ topicId: this.topicId }), {})
          .toPromise()
          .then(
            (response: any) => this.loadOnlyOffice()
          );
      }
    );
  }

  onRequestHistory() {
    let historyObj = this.config.history || null;

    this.docEditor.refreshHistory(
      {
        currentVersion: this.config.file.version,
        history: historyObj
      });
  }

  onRequestChangeHistoryData(data: any) {
    let version = data.data;
    let urlArr = this.config.setHistoryData.url;
    let urlDiffArr = this.config.setHistoryData.urlDiff;

    this.docEditor.setHistoryData({
      version: version,
      url: urlArr[version - 1] !== '' ? urlArr[version - 1] : null,
      urlDiff: urlDiffArr[version - 1] !== '' ? urlDiffArr[version - 1] : null,
    });
  }

  onRequestHistoryClose() {
    let iframe = document.getElementsByTagName('iframe')[0];
    let newFrame = document.createElement('div');
    newFrame.setAttribute('id', 'iframeEditor');

    let parent = iframe.parentElement;
    parent.removeChild(iframe);
    parent.appendChild(newFrame);
    this.docEditor = null;

    this.loadEditor();
  }

  private loadOnlyOffice() {
    this.ooApiService.getUrl('/topic/' + this.topicId, {})
      .toPromise()
      .then(
        (res: any) => {
          this.config = JSON.parse(res._body);
          this.apiUrl = this.config.apiUrl;
          this.loadEditor();
        }
      );
  }

  private loadEditor() {
    DocsAPI.baseUrl = this.configService.get('docsUrl') + '/web-apps/apps/';

    this.docEditor = new DocsAPI.DocEditor('iframeEditor', {
      width: '100%',
      height: '100%',
      type: this.config.editor.type,
      documentType: this.config.editor.documentType,
      document: {
        title: this.config.file.name,
        url: this.config.file.uri,
        fileType: this.config.file.ext,
        key: this.config.editor.key,
        info: {
          author: 'Me',
          created: new Date().toDateString()
        },
        permissions: {
          edit: this.config.editor.isEdit,
          download: true
        }
      },
      editorConfig: {
        mode: this.config.editor.mode,
        lang: this.translateService.currentLang,
        callbackUrl: this.config.editor.callbackUrl,
        user: {
          email: this.currentUser.email,
          firstname: this.currentUser.firstName !== '' ? this.currentUser.firstName : this.currentUser.email,
          lastname: this.currentUser.lastName
        },
        embedded: {
          saveUrl: this.config.file.uri,
          embedUrl: this.config.file.uri,
          shareUrl: this.config.file.uri,
          toolbarDocked: 'top'
        },
        customization: {
          chat: true,
          comments: true,
          feedback: false,
          goback: false
        },
        fileChoiceUrl: this.config.editor.fileChoiceUrl,
        plugins: this.config.editor.plugins
      },
      events: {
        'onDocumentStateChange': function (event: any) {
          let title = document.title.replace(/\*+$/g, ' ');
          document.title = title + (event.data ? '*' : '');
        },
        'onRequestEditRights': function () {
          location.href = location.href.replace(RegExp('mode=view\&?', 'i'), '');
        },
        'onError': function (event: any) {
          console.error(event.data);
        },
        'onRequestHistory': onRequestHistory,
        'onRequestHistoryData': onRequestChangeHistoryData,
        'onRequestHistoryClose': onRequestHistoryClose
      }
    });
  }
}
