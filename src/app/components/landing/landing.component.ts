import { NgIfContext } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { mapTo, of, startWith } from 'rxjs';

@Component({
	selector: 'app-landing',
	templateUrl: './landing.component.html',
	styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit {

	@ViewChildren('preload') preload!: QueryList<ElementRef>;
	@ViewChildren('text') text!: QueryList<ElementRef>;
	@ViewChildren('colors') colors!: QueryList<ElementRef>;
	
	@ViewChild('toolbar', {static: true}) toolbar!: ElementRef;


	@ViewChildren('canvas') canvasList!: QueryList<HTMLCanvasElement>;
	private ctx!: CanvasRenderingContext2D;



	public notes: any[] = new Array(1).fill(['',0]);
	public $doodles: number[] = this.notes.map(e => e[1] ? 1 : 0);
	

	public note = 'note-container';
	public currentElement: any;
	public currentColor: string = 'black';
	public currentIndex: number = 0;
	public mode: string = 'text';
	
	private draw: boolean = false;
	private prevX: any = null;
	private prevY: any = null;
	private currentNote: any = null;
	public z: number = -1;
	

	constructor() { }

	changeDelay(n: number) {
		this.preload.forEach(e => {
			e.nativeElement.style.animationDelay = `${n}s`;
		});
	}

	ngAfterViewInit(): void {
		this.changeDelay(0);
		setTimeout(() => this.changeDelay(0.5), 500);
		
		this.setActive(this.colors.toArray()[0].nativeElement);

		this.text.forEach((e,i) => {
			e.nativeElement.firstChild.innerHTML = this.notes[i][0];
			this.$doodles[i]
			setTimeout(() => {
				let img = new Image;
				img.src = this.notes[i][1];
				let canvas = e.nativeElement.lastElementChild;
				canvas.height = e.nativeElement.scrollHeight;
				canvas.width = 280;
				canvas.onselect = function() {return false};
				let ctx = canvas.getContext('2d');
				img.onload = function() {
					ctx.drawImage(img, 0, 0);
				};
			},0);

		});

	}

	ngOnInit(): void {

		if(localStorage['notes']) this.notes = JSON.parse(localStorage['notes']);
		
		this.$doodles = this.notes.map(e => e[1] ? 1 : 0);

		console.log(of(this.$doodles[1]).pipe(
			mapTo(true),
			startWith(false)
		))
		
	}


	enter(event:any) {

		document.execCommand('insertLineBreak');
		event.preventDefault();

	}

	open (event: any, i: number) {
		this.toolbar.nativeElement.style = 'transform: translateY(0%);';
		this.currentElement = event.target;
		this.currentIndex = i;

		this.currentNote = this.text.toArray()[i].nativeElement;
		
		let canvas;
		if(this.currentNote.lastElementChild?.nodeName=="CANVAS") canvas = this.currentNote.lastElementChild;
		if(canvas) this.ctx = canvas.getContext('2d');

		this.z = -1;
	}

	close (event: any) {
		this.toolbar.nativeElement.style = 'transform: translateY(100%);';
		this.mode = 'text';

		this.z = 3;

		let text = [...event.target.innerHTML];
		let res;
		text.every((e,i) => {
			if(e=="<" && text[i+1]=="!") {
				res = text.slice(0,i).join('');
				return false;
			}
			return true;
		});

		this.notes[this.currentIndex][0] = res;


		if(this.$doodles[this.currentIndex]) {
			let canvas = this.currentNote.lastElementChild;
			this.notes[this.currentIndex][1] = canvas.toDataURL();
		}

		localStorage['notes'] = JSON.stringify(this.notes);

	}

	preventClose(event: any) {
		event.preventDefault();
	}

	add() {
		this.notes.push(['', 0]);
		this.$doodles.push(0);
		
		localStorage['notes'] = JSON.stringify(this.notes);
	}

	del(event:any, i:number) {

		this.notes.splice(i,1);
		this.$doodles = this.notes.map(e => e[1] ? 1 : 0);

		localStorage['notes'] = JSON.stringify(this.notes);
		
		event.preventDefault();
	}

	activeColor(event: any) {

		this.setActive(event.target);

		if(this.mode=='text'){
			
			let sel = window.getSelection();
			let range: any;
			if (sel?.rangeCount && sel.getRangeAt) {
				range = sel.getRangeAt(0);
			}
	
			document.designMode = 'on';
			if(range) {
				sel?.removeAllRanges();
				sel?.addRange(range);
			}
			document.execCommand('ForeColor', false, this.currentColor);
			document.designMode = 'off';
	
			this.currentElement.focus();

		} else {
			this.ctx.strokeStyle = this.currentColor;
			this.ctx.fillStyle = this.ctx.strokeStyle;
			this.mode = 'draw';
		}
		
	}

	setActive(color: any) {

		this.colors.forEach(c => {
			if(c.nativeElement.style.backgroundColor=='rgb(50, 50, 50)') c.nativeElement.style.backgroundColor='';
			c.nativeElement.style = `
					transform: scale(1);
					background-color: ${c.nativeElement.style.backgroundColor};`;
		});

		if(color.style.backgroundColor=='') {
			color.style.backgroundColor = 'rgb(50,50,50)';
			this.currentColor = 'black';
		} else this.currentColor = color.style.backgroundColor;

		color.style = `
				transform: scale(0.85);
				background-color: ${color.style.backgroundColor};
				box-shadow: inset 5px 5px 10px rgb(0 0 0 / 0.5);`;
		
	}


	changeMode() {

		let i = this.currentIndex
		let before = this.$doodles[i];

		if(this.mode == 'text'){
			this.mode = 'draw';

			this.currentNote.style.caretColor = 'transparent';
			
			// create canvas
			if(!before) {

				this.$doodles[i] = 1;
				console.log(this.$doodles);

				setTimeout(() => {

					let canvas = this.currentNote.lastElementChild;

					canvas.height = this.currentNote.scrollHeight;
					canvas.width = 280;
					canvas.onselect = function() {return false};


					if(canvas) this.ctx = canvas.getContext('2d');
					this.ctx!.lineWidth = 1;
					
				},0);

			}
			this.z = 3;

		} else {
			this.mode = 'text';
			this.z = -1;
			
			this.currentNote.style.caretColor = 'auto';
		}
		
	}

	createCanvas() {}

	erase() {
		if(this.mode!=='erase') this.mode = 'erase';
		else this.mode = 'draw';
	}

	clear() {
		let canvas = this.currentNote.lastElementChild;
		this.ctx?.clearRect(0, 0, canvas.width, canvas.height);
	}



	drawing(event: any) {

		this.draw = true;

		this.ctx.beginPath();
		this.ctx.moveTo(this.prevX-1, this.prevY-1);

		if(this.mode=='draw') {
			this.ctx!.globalCompositeOperation = 'source-over';
			this.ctx.arc(this.prevX, this.prevY, this.ctx.lineWidth, 0, Math.PI*2, false);
		} else if(this.mode=='erase') {
			this.ctx!.globalCompositeOperation = 'destination-out';
			this.ctx?.arc(this.prevX,this.prevY,10,0,Math.PI*2,false);
		} else return;

		this.ctx.fill();
		event.preventDefault();

	}

	
	stop(event: any) {
		this.draw = false;

		event.preventDefault();
	}

	move(event: any) {
		
		if(this.mode!=='text') {

			let rect = this.currentNote.lastElementChild.getBoundingClientRect();

			let clientX = (event.clientX - rect.left) / 2;
			let clientY = (event.clientY - rect.top) / 2;
	
			if(this.prevX == null || this.prevY == null || !this.draw) { // ???
				this.prevX = clientX;
				this.prevY = clientY;
				return;
			}
	
			let mouseX = clientX;
			let mouseY = clientY;


			if(this.mode=='draw') {
				this.ctx.lineTo(mouseX,mouseY);
				this.ctx.stroke();
			} else if(this.mode=='erase') {
				this.ctx.beginPath();
				this.ctx?.arc(this.prevX,this.prevY,10,0,Math.PI*2,false);
				this.ctx?.fill();
			} else return;
	
			this.prevX = mouseX;
			this.prevY = mouseY;
			
			event.preventDefault();
		}
	}


	expand(event: any) {

		if(this.$doodles[this.currentIndex]) {

			setTimeout(() => {

				let canvas = this.currentNote.lastElementChild;
			
				let temp = <ImageData> this.ctx?.getImageData(0, 0, canvas.width, canvas.height);
				this.ctx!.canvas.height = this.currentNote.clientHeight;
				this.ctx?.putImageData(temp, 0, 0);
				this.ctx!.lineWidth = 1;

			},0);
			
		}
		
		if(this.mode=='draw') event.preventDefault();
	}

}
