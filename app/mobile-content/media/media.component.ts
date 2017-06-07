import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';

import { DeleteMediumDialogComponent } from './delete-medium-dialog/delete-medium-dialog.component';
import { EditMediumDialogComponent } from './edit-medium-dialog/edit-medium-dialog.component';
import { Medium } from './medium.model';
import { Status } from '../shared/status.model';
import { UploadMediumDialogComponent } from './upload-medium-dialog/upload-medium-dialog.component';

import { MediaService } from './shared/media.service';
import { SearchMediaArgs } from '../shared/REST/searchArgs.model';
import { ServerError } from '../shared/REST/serverError.model';
import * as Result from '../shared/REST/serverResults.model';

@Component({
  moduleId: module.id,
  selector: 'hip-media',
  styleUrls: ['media.component.css'],
  templateUrl: 'media.component.html',
  providers: [ MediaService ]
})
export class MediaComponent implements OnInit {
  media: Medium[];
  statuses = Status.getValuesForSearch();
  types = ['ALL'].concat(Medium.types);
  error: ServerError = null;
  // TODO: View for errors


  // search parameters
  searchQuery = '';
  selectedStatus = 'ALL';
  selectedType = 'ALL';
  showingSearchResults = false;

  // pagination parameters
  currentPage = 1;
  pageSize = 10;
  totalItems: number;   // must be fetched from server

  // dialogs
  private deleteDialogRef: MdDialogRef<DeleteMediumDialogComponent>;
  private editDialogRef: MdDialogRef<EditMediumDialogComponent>;
  private uploadDialogRef: MdDialogRef<UploadMediumDialogComponent>;

  constructor(private dialog: MdDialog, private service: MediaService ) {}

  ngOnInit() {
    this.getPage(1);
  }

  addMedium() {
    this.uploadDialogRef = this.dialog.open(UploadMediumDialogComponent, { width: '35em' });
    this.uploadDialogRef.afterClosed().subscribe(
        (obj: any) => {

          let newMedium = obj.media;
          let file: File = obj.file;
          if (newMedium) {

            this.service.create(newMedium)
                .then((res: Result.Create) => {
               if (file)
                 return this.service.uploadFile(Number(res.id), file);
             })
                .then(() => {this.readMedias(); })
                .catch((err: ServerError) => {this.setError(err); });
          }
        }
    );
  }

  deleteMedium(medium: Medium) {
    this.deleteDialogRef = this.dialog.open(DeleteMediumDialogComponent);
    this.deleteDialogRef.componentInstance.mediumTitle = medium.title;
    this.deleteDialogRef.afterClosed().subscribe(
      (confirmed: boolean) => {
        if (confirmed) {
           this.service.delete(Number(medium.id))
              .then((res: Result.Delete) => { this.readMedias(); })
              .catch((err: ServerError) => {this.setError(err); });
        }
      }
    );
  }

  editMedium(medium: Medium) {
    this.editDialogRef = this.dialog.open(EditMediumDialogComponent, { width: '30em', data: { medium: medium } });
    this.editDialogRef.afterClosed().subscribe(
      (newMedium: Medium) => {
        if (newMedium) {
          this.service.update(newMedium)
              .then((res: Result.Update) => {
              medium.description = newMedium.description;
              medium.type = newMedium.type;
              medium.title = newMedium.title; })
              .catch((err: ServerError) => {this.setError(err); });
        }
      }
    );
  }

  findMedia() {
    this.showingSearchResults = true;
    this.currentPage = 1;
    this.readMedias();
  }

  getPage(page: number) {
    this.currentPage = page;
    this.readMedias();
  }

  reloadList() {
    this.currentPage = 1;
    this.readMedias();

  }

  resetSearch() {
      this.showingSearchResults = false;
      this.searchQuery = '';
      this.currentPage = 1;
      this.readMedias();
  }

  private setError(err: ServerError) {
    this.error = err;
   }

   private readMedias() {
       this.media = [];
       this.totalItems = 0;
       let args = new SearchMediaArgs(undefined, undefined, this.currentPage - 1, this.pageSize, undefined, this.searchQuery, this.selectedStatus, this.selectedType);
       this.service.readAll(args)
           .then((res: Result.AllEntities<Medium>) => {
               this.media = res.entities;
               this.totalItems = res.total;
           })
           .catch((err: ServerError) => {this.setError(err); });
   }

}
