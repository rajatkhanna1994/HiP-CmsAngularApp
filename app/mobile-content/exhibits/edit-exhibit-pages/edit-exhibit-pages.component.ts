import { Component, Input, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { ToasterService } from 'angular2-toaster';
import { TranslateService } from 'ng2-translate';

import { ConfirmDeleteDialogComponent } from '../../shared/confirm-delete-dialog/confirm-delete-dialog.component';
import { CreateExhibitPageDialogComponent } from '../create-exhibit-page-dialog/create-exhibit-page-dialog.component';
import { ExhibitPage } from '../shared/exhibit-page.model';
import { ExhibitPageService } from '../shared/exhibit-page.service';
import { ExhibitService } from '../shared/exhibit.service';

import { Status } from '../../shared/status.model';

@Component({
  moduleId: module.id,
  selector: 'hip-edit-exhibit-pages',
  styleUrls: ['edit-exhibit-pages.component.css'],
  templateUrl: 'edit-exhibit-pages.component.html'
})
export class EditExhibitPagesComponent implements OnInit {
  @Input() exhibitId: number;
  pages: ExhibitPage[];
  searchStatusOptions = Status.getValuesForSearch();
  selectedStatus = 'ALL';
  statusOptions = Status.getValues();

  private createDialogRef: MdDialogRef<CreateExhibitPageDialogComponent>;
  private deleteDialogRef: MdDialogRef<ConfirmDeleteDialogComponent>;

  constructor(private dialog: MdDialog,
              private exhibitPageService: ExhibitPageService,
              private exhibitService: ExhibitService,
              private toasterService: ToasterService,
              private translateService: TranslateService) {}

  ngOnInit() {
    this.reloadList();
  }

  createPage() {
    this.createDialogRef = this.dialog.open(CreateExhibitPageDialogComponent, { width: '75em' });
    this.createDialogRef.afterClosed().subscribe(
      (newPage: ExhibitPage) => {
        if (newPage) {
          newPage.exhibitId = this.exhibitId;
          this.exhibitPageService.createPage(newPage)
            .then(
              newId => {
                newPage.id = newId;
                this.pages.push(newPage);
                this.toasterService.pop('success', this.translateService.instant('page created'));
              }
            ).catch(
              () => this.toasterService.pop('error', this.translateService.instant('create failed'))
            );
        }
      }
    );
  }

  deletePage(page: ExhibitPage) {
    this.deleteDialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: this.translateService.instant('delete page'),
        message: this.translateService.instant('confirm delete page', { title: page.title })
      }
    });
    this.deleteDialogRef.afterClosed().subscribe(
      (confirmed: boolean) => {
        if (confirmed) {
          this.exhibitPageService.deletePage(page.id)
            .then(
              () => {
                this.pages.splice(this.pages.indexOf(page), 1);
                this.toasterService.pop('success', this.translateService.instant('page deleted'));
              }
            ).catch(
              () => this.toasterService.pop('error', this.translateService.instant('delete failed'))
            );
        }
      }
    );
  }

  movePageDown(page: ExhibitPage) {
    let pos = this.pages.indexOf(page);
    if (pos < this.pages.length) {
      this.pages[pos] = this.pages.splice(pos + 1, 1, this.pages[pos])[0];
    }
    this.updatePageOrder();
  }

  movePageUp(page: ExhibitPage) {
    let pos = this.pages.indexOf(page);
    if (pos > 0) {
      this.pages[pos] = this.pages.splice(pos - 1, 1, this.pages[pos])[0];
    }
    this.updatePageOrder();
  }

  reloadList() {
    this.exhibitPageService.getAllPagesFor(this.exhibitId, this.selectedStatus)
      .then(
        pages => this.pages = pages
      ).catch(
        () => this.toasterService.pop('error', this.translateService.instant('page load failed'))
      );
  }

  savePage(page: ExhibitPage) {
    this.exhibitPageService.updatePage(page)
      .then(
        () => this.toasterService.pop('success', this.translateService.instant('page updated'))
      ).catch(
        () => this.toasterService.pop('error', this.translateService.instant('update failed'))
      );
  }

  private updatePageOrder() {
    this.exhibitService.getExhibit(this.exhibitId)
      .then(
        exhibit => {
          exhibit.pages = this.pages.map(page => page.id);
          return this.exhibitService.updateExhibit(exhibit);
        }
      ).then(
        () => this.toasterService.pop('success', this.translateService.instant('page order updated'))
      ).catch(
        () => this.toasterService.pop('error', this.translateService.instant('update failed'))
      );
  }
}