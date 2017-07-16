import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { TranslateService } from 'ng2-translate';
import { ToasterService } from 'angular2-toaster';

import { ConfirmDeleteDialogComponent } from '../shared/confirm-delete-dialog/confirm-delete-dialog.component';
import { CreateTagDialogComponent } from './create-tag-dialog/create-tag-dialog.component';
import { Status } from '../shared/status.model';
import { Tag } from './shared/tag.model';
import { TagService } from './shared/tag.service';

@Component({
  moduleId: module.id,
  selector: 'hip-tags',
  templateUrl: 'tags.component.html',
  styleUrls: ['tags.component.css']
})
export class TagsComponent implements OnInit {
  tags: Tag[];
  statuses = Status.getValuesForSearch();

  // search parameters
  searchQuery = '';
  selectedStatus = 'ALL';
  showingSearchResults = false;

  // pagination parameters
  currentPage = 1;
  pageSize = 10;
  totalItems: number;

  private tagCache = new Map<number, Tag[]>();

  private createDialogRef: MdDialogRef<CreateTagDialogComponent>;
  private deleteDialogRef: MdDialogRef<ConfirmDeleteDialogComponent>;

  constructor(private dialog: MdDialog,
              private tagService: TagService,
              private toasterService: ToasterService,
              private translateService: TranslateService) {}

  ngOnInit() {
    this.getPage(1);
  }

  createTag() {
    this.createDialogRef = this.dialog.open(CreateTagDialogComponent, {width: '45em'});
    this.createDialogRef.afterClosed().subscribe(
      (newTag: Tag) => {
        if (newTag) {
          this.tagService.createTag(newTag)
            .then(
              response => {
                this.toasterService.pop('success', this.translate('tag saved'));
                this.reloadList();
              }
            ).catch(
              error => this.toasterService.pop('error', this.translate('Error while saving'), error)
            );
        }
        this.createDialogRef = null;
      }
    );
  }

  deleteTag(tag: Tag) {
    this.deleteDialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: this.translateService.instant('delete tag'),
        message: this.translateService.instant('confirm delete tag', { name : tag.title })
      }
    });
    this.deleteDialogRef.afterClosed().subscribe(
      (confirmed: boolean) => {
        if (confirmed) {
          this.tagService.deleteTag(tag.id)
            .then(
              response => {
                this.toasterService.pop('success', this.translate('tag deleted'));
                this.reloadList();
              }
            ).catch(
              error => this.toasterService.pop('error', this.translate('Error while deleting'), error)
            );
        }
        this.deleteDialogRef = null;
      }
    );
  }

  findTags() {
    if (this.searchQuery.trim().length > 0) {
      this.tags = undefined;
      this.tagCache.clear();
      this.getPage(1);
      this.showingSearchResults = true;
    }
  }

  getPage(page: number) {
    if (this.tagCache.has(page)) {
      this.tags = this.tagCache.get(page);
      this.currentPage = page;
    } else {
      this.tagService.getAllTags(page, this.pageSize, this.selectedStatus, this.searchQuery)
        .then(
          (data) => {
            this.tags = data.items;
            this.totalItems = data.total;
            this.currentPage = page;
            this.tagCache.set(this.currentPage, this.tags);
          }
        ).catch(
          (error: string) => console.error(error)
        );
    }
  }

  resetSearch() {
    this.searchQuery = '';
    this.tagCache.clear();
    this.getPage(1);
    this.showingSearchResults = false;
  }

  reloadList() {
    this.tags = undefined;
    this.tagCache.clear();
    this.getPage(this.currentPage);
  }

  private translate(data: string): string {
    let translatedResponse: string;
    this.translateService.get(data).subscribe(
      (value: string) => {
        translatedResponse = value;
      }
    );
    return translatedResponse;
  }

}