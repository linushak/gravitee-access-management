/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Component, OnInit, ViewChild} from '@angular/core';
import { MatInput } from '@angular/material/input';
import {ActivatedRoute, Router} from '@angular/router';
import {DomainService} from '../../../services/domain.service';
import {DialogService} from '../../../services/dialog.service';
import {SnackbarService} from '../../../services/snackbar.service';
import {AuthService} from '../../../services/auth.service';
import {NavbarService} from '../../../components/navbar/navbar.service';
import * as _ from 'lodash';

export interface Tag {
  id: string;
  name: string;
}

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class DomainSettingsGeneralComponent implements OnInit {
  @ViewChild('chipInput', { static: true }) chipInput: MatInput;
  @ViewChild('deleteDomainBtn', { static: false }) deleteDomainBtn: any;
  private envId: string;
  formChanged = false;
  domain: any = {};
  domainOIDCSettings: any = {};
  tags: Tag[];
  selectedTags: Tag[];
  readonly = false;
  logoutRedirectUri: string;
  logoutRedirectUris: any[] = [];

  constructor(private domainService: DomainService,
              private dialogService: DialogService,
              private snackbarService: SnackbarService,
              private router: Router,
              private route: ActivatedRoute,
              private authService: AuthService,
              private navbarService: NavbarService) {
  }

  ngOnInit() {
    this.envId = this.route.snapshot.params['envHrid'];
    this.domain = this.route.snapshot.data['domain'];
    this.domainOIDCSettings = this.domain.oidc || {};
    this.logoutRedirectUris = _.map(this.domainOIDCSettings.postLogoutRedirectUris, function (item) { return { value: item }; });
    if (this.domain.tags === undefined) {
      this.domain.tags = [];
    }
    this.readonly = !this.authService.hasPermissions(['domain_settings_update']);
    this.initTags();
  }

  initTags() {
    let tags = this.route.snapshot.data['tags'];
    this.selectedTags = this.domain.tags.map(t => _.find(tags, { 'id': t })).filter(t => typeof t !== 'undefined');
    this.tags = _.difference(tags, this.selectedTags);
  }

  addTag(event) {
    this.selectedTags = this.selectedTags.concat(_.remove(this.tags, { 'id': event.option.value }));
    this.tagsChanged();
  }

  removeTag(tag) {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id);
    this.tags.push(tag);
    this.tagsChanged();
  }

  tagsChanged() {
    this.chipInput['nativeElement'].blur();
    this.formChanged = true;
    this.domain.tags = _.map(this.selectedTags, tag => tag.id);
  }

  enableDomain(event) {
    this.domain.enabled = event.checked;
    this.formChanged = true;
  }

  setMaster(event) {
    this.domain.master = event.checked;
    this.formChanged = true;
  }

  addLogoutRedirectUris(event) {
    event.preventDefault();
    if (this.logoutRedirectUri) {
      if (!this.logoutRedirectUris.some(el => el.value === this.logoutRedirectUri)) {
        this.logoutRedirectUris.push({value: this.logoutRedirectUri});
        this.logoutRedirectUris = [...this.logoutRedirectUris];
        this.logoutRedirectUri = null;
        this.formChanged = true;
      } else {
        this.snackbarService.open(`Error : redirect URI "${this.logoutRedirectUri}" already exists`);
      }
    }
  }

  deleteLogoutRedirectUris(logoutRedirectUri, event) {
    event.preventDefault();
    this.dialogService
      .confirm('Remove logout redirect URI', 'Are you sure you want to remove this redirect URI ?')
      .subscribe(res => {
        if (res) {
          _.remove(this.logoutRedirectUris, { value: logoutRedirectUri });
          this.logoutRedirectUris = [...this.logoutRedirectUris];
          this.formChanged = true;
        }
      });
  }

  update() {
    this.domain.oidc = { 'postLogoutRedirectUris' : _.map(this.logoutRedirectUris, 'value') };
    this.domainService.patchGeneralSettings(this.domain.id, this.domain).subscribe(response => {
      this.domainService.notify(response);
      this.formChanged = false;
      this.snackbarService.open('Domain ' + this.domain.name + ' updated');
      // if hrid has changed, reload the page
      if (response.hrid !== this.domain.hrid) {
        this.router.navigate(['/environments', this.envId, 'domains', response.hrid, 'settings', 'general']);
      } else {
        this.domain = response;
      }
    });
  }

  delete(event) {
    event.preventDefault();
    this.dialogService
      .confirm('Delete Domain', 'Are you sure you want to delete this domain ?')
      .subscribe(res => {
        if (res) {
          this.deleteDomainBtn.nativeElement.loading = true;
          this.deleteDomainBtn.nativeElement.disabled = true;
          this.domainService.delete(this.domain.id).subscribe(response => {
            this.deleteDomainBtn.nativeElement.loading = false;
            this.snackbarService.open('Domain ' + this.domain.name + ' deleted');
            this.navbarService.notifyDomain({});
            this.router.navigate(['']);
          })
        }
      });
  }
}
