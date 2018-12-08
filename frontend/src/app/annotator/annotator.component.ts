import { Component, AfterViewInit } from '@angular/core';

import { AnnotatorService } from './annotator.service';

@Component({
  selector: 'app-annotator',
  templateUrl: './annotator.component.html',
  styleUrls: ['./annotator.component.scss']
})
export class AnnotatorComponent implements AfterViewInit {

  public pages: any[] = [];

  constructor(
    private pdfReaderService: AnnotatorService,
  ) { }

  ngOnInit() {
    this.pdfReaderService.render('./assets/dummy-data/example.pdf');
  }

  public ngAfterViewInit(): void {
    this.renderPDF('./assets/dummy-data/example.pdf');
  }

  private renderPDF(url: string): void {
    this.pdfReaderService.render(url)
      .then(pages =>  {
        this.pages = pages;
      });
  }

}
