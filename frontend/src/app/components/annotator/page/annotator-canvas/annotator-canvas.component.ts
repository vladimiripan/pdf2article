import { Component, AfterViewInit, ElementRef, Input, HostListener } from '@angular/core';

import { AnnotatorService, Annotation, AnnotationType } from '../../annotator.service';

@Component({
  selector: 'annotator-canvas',
  templateUrl: './annotator-canvas.component.html',
  styleUrls: ['./annotator-canvas.component.scss']
})
export class AnnotatorCanvasComponent implements AfterViewInit {

  @Input()
  public viewport: any;

  @Input()
  public pageIndex: number;

  private ctx: CanvasRenderingContext2D;

  private draw: boolean = false;

  private currentAnnotation: Annotation;

  constructor(
    private element: ElementRef,
    private annotatorService: AnnotatorService
  ) {
    this.resetAnnotation();
  }

  public ngAfterViewInit(): void {
    const $canvas = this.createAnnotationCanvas(this.viewport);
    this.ctx = $canvas.getContext('2d');
    this.element.nativeElement.appendChild($canvas);
    this.drawAnnotations();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown($event) {
    console.log(event);
    this.currentAnnotation.x = $event.offsetX;
    this.currentAnnotation.y = $event.offsetY;
    this.currentAnnotation.tag = this.annotatorService.getAnnotationType();
    console.log(this.annotatorService.getAnnotationType());
    this.draw = true;
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove($event) {
    if (!this.draw) return;

    const { offsetX, offsetY } = $event;
    this.currentAnnotation.xEnd = offsetX - this.currentAnnotation.x;
    this.currentAnnotation.yEnd = offsetY - this.currentAnnotation.y;
    this.drawAnnotations();
    this.drawAnnotation(this.currentAnnotation);
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp($event) {
    if (this.draw) {
      this.currentAnnotation.page = this.pageIndex;
      this.annotatorService.setAnnotation(this.currentAnnotation);
    }

    this.draw = false;
  }

  private resetAnnotation() {
    this.currentAnnotation = {
      x: 0,
      y: 0,
      xEnd: 0,
      yEnd: 0,
      page: 0
    }
  }

  private createAnnotationCanvas(viewport): HTMLCanvasElement {
    const { width, height } = viewport,
          $canvas = document.createElement('canvas');

    $canvas.classList.add('page-canvas');
    $canvas.width = width;
    $canvas.height = height;

    return $canvas;
  }

  private drawAnnotation(annotation: Annotation): void {
    const { x, y, xEnd, yEnd } = annotation;
    this.ctx.beginPath();
    this.ctx.rect(x, y, xEnd, yEnd);
    this.ctx.stroke();
    console.log(annotation);
    switch(annotation.tag) {
      case AnnotationType.Article:
        this.ctx.strokeStyle = 'red';
        break;
      case AnnotationType.Title:
        this.ctx.strokeStyle = 'blue';
        break;
      case AnnotationType.Author:
        this.ctx.strokeStyle = 'green';
        break;
      case AnnotationType.Content:
        this.ctx.strokeStyle = 'yellow';
        break;
    }
    this.ctx.closePath();
  }

  drawAnnotations() {
    this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    const annotations: Annotation[] = this.annotatorService.getAnnotations(this.pageIndex);
    annotations.forEach(annotation => this.drawAnnotation(annotation));
  }

}