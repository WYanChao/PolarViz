//fixed table headers
document.getElementById("data-table").addEventListener("scroll",function(){
   var translate = "translate(0,"+this.scrollTop+"px)";
   this.querySelector("thead").style.transform = translate;
});

function PolarViz(){
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	// define var
	let TableTitle, 
		ColorAccessor, 
		Dimensionality, 
		DAnchor, 
		DATA;
	
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////	
	// main function
	function PV(div) {		
		/////////////////////////////////////////////////////////
		// set some constent values
		let	radiusDA = 7,
			radiusDT = 5; // radius of DA and data points
		let nodecolor = d3.scaleOrdinal(d3.schemeCategory20); //set color scheme
		const formatnumber = d3.format(',d');
		let binnumber = 50; // default value
		let chartRadius;		
		
		/////////////////////////////////////////////////////////	
		// Data pre-processing
		var titles = TableTitle; // get the attributes name
		titles.unshift('index');
		// rewrite the data
		var dataE = DATA.slice();//dataE, include more attributes.
		dataE.forEach((d,i) => {
			d.index = i;
			d.theta = 0;
			d.dist = 0;
			d.distH = 0;
			d.id = i;
			d.color = nodecolor(ColorAccessor(d));
		});
		//set which dimensions will be used for RadViz
		let dimensions = Dimensionality,
			normalizeSuffix = '_normalized',
			dimensionNamesNormalized = dimensions.map(function(d) { return d + normalizeSuffix; }), // 'sepalL_normalized'
			DN = dimensions.length,
			DA = DAnchor; // intial ;
		dataE = addNormalizedValues(dataE);
		calculateDataSum(dataE); // calculateDataSum. only calculate once
		calculateNodePosition(); // calculateNodePosition. need update when DAs move.	
		// prepare the DA data 
		let DAdata = dimensions.map(function(d, i) {
			let x = Math.cos(DA[i]) * 1;
			let y = Math.sin(DA[i]) * 1;
			return {
				theta: DA[i], //[0, 2*PI]
				x: x,
				y: y,
				fixed: true,
				name: d
				};
		});	//DAdata is based on DA.
		// legend data
		let colorspace = [], colorclass = [];
		dataE.forEach(function(d, i){
			if(colorspace.indexOf(d.color)<0) {
				colorspace.push(d.color); 
				colorclass.push(d.class); }
		});	
		// prepare the histdata
		let keys = colorclass.slice();
		keys.unshift('index');
		//histdata
		let Histdata = [];
		Histdata = initializeHistData(dataE, colorclass, keys, binnumber);	
		
		/////////////////////////////////////////////////////////		
		/////////////////////////////////////////////////////////
		//Render the list.
		const PVTable 		= d3.select('#data-table').data([pvtable]);
		//Render the radviz
		const PVRadviz		= d3.select('#radviz').data([pvradviz()]);
		//Render the histogram
		const PVHistogram 	= d3.select('#histogram').data([pvhistogram()]);
		
		/////////////////////////////////////////////////////////
		// Rendering
		PVTable.each(render);
		renderAll();
		function render(method) {
			d3.select(this).call(method);	
		}
		function renderAll() {
			PVRadviz.each(render);
			PVHistogram.each(render);
		}		
		
		/////////////////////////////////////////////////////////
		// reset functions
		// add event listeners
		document.getElementById('resetRadViz').onclick = function() {resetRadViz()};	
		// reset RadViz
		function resetRadViz() {
			//remove all svg plot
			d3.select('svg#radviz').remove();
			d3.select('svg#histogram').remove();
			
			// re-intialized all data and then calculate
			DA = [];
			DA = Array.apply(null, {length: DN}).map(Number.call, Number).map(x=>x*2*Math.PI/DN); // intial ;
			DAdata = dimensions.map(function(d, i) {
				let x = Math.cos(DA[i]) * 1;
				let y = Math.sin(DA[i]) * 1;
				return {
					theta: DA[i], //[0, 2*PI]
					x: x,
					y: y,
					fixed: true,
					name: d
					};
			});	//DAdata is based on DA.
			calculateNodePosition();
			Histdata = [];
			Histdata = initializeHistData(dataE, colorclass, keys, binnumber);			
			//re-rendering
			renderAll();
		} /* 	*/	
			
		// add event listeners
		document.getElementById('resetPolarViz').onclick = function() {resetPolarViz()};
		// reset PolarViz
		function resetPolarViz() {
			//remove all svg plot
			d3.select('svg#radviz').remove();
			d3.select('svg#histogram').remove();
			DAdata = dimensions.map(function(d, i) {
				let x = Math.cos(DA[i]) * 1;
				let y = Math.sin(DA[i]) * 1;
				return {
					theta: DA[i], //[0, 2*PI]
					x: x,
					y: y,
					fixed: true,
					name: d
					};
			});		
			calculateNodePosition();
			Histdata = [];
			Histdata = initializeHistData(dataE, colorclass, keys, binnumber);			
			//re-rendering
			renderAll();		
		}	
		
		// add event listeners
		//document.getElementById('forbinnumber').onclick = function() {SetBinNum()};
		document.getElementById('SetBinNum').onclick = function() {SetBinNum()};
		// set bin number
		function SetBinNum() {
			let tempa = document.getElementById('BinInput').value;
			if (isNaN(tempa) || tempa < 10 || tempa > 10000 ) {
				console.log('AInput is not suitable. Use default value (50).');
				tempa = binnumber;
			}
			if (!Number.isInteger(+tempa)) {
				console.log('BInput is not suitable. Use floor of this value.', Math.floor(+tempa));
				tempa = Math.floor(+tempa);			
			}
			//remove histogram plot
			d3.select('svg#histogram').remove();
			
			//clear data
			Histdata = [];
			Histdata = initializeHistData(dataE, colorclass, keys, tempa);
			PVHistogram.each(render);
		}

		/////////////////////////////////////////////////////////
		// Function for display radviz
		function pvradviz(){
			let margin = {top:50, right:150, bottom:50, left:80},
				width = 600,
				height = 450;
		
			function chart(div) {
				div.each(function() {
					let div = d3.select(this);
					
					let svg = div.append('svg')
							.attr('id', 'radviz')
							.attr('width', width)
							.attr('height', height);						
					svg.append('rect')
						.attr('fill', 'transparent')
						.attr('width', width/*-margin.left-margin.right*/)
						.attr('height', height/*-margin.top-margin.bottom*/);//classed('bg', true).
					// transform a distance.(can treat as margin)
					let center = svg.append('g').attr('class', 'center').attr('transform', `translate(${margin.left},${margin.top})`); 
					chartRadius = Math.min((height-margin.top-margin.bottom) , (width-margin.left-margin.right))/2;
					calculateDAdata(chartRadius);
					
					/* --------------- section --------------- */
					/*Draw the big circle: drawPanel(chartRadius)*/
					// The default setting: 'stroke="black" stroke-width="3"'
					drawPanel(chartRadius);
					
					/* --------------- section --------------- */
					/*Draw the Dimensional Anchor nodes: tips components, and then call drawDA() to draw DA points, and call drawDALabel to draw DA labels*/
					// prepare the DA tips components
					svg.append('rect').attr('class', 'DAtip-rect');			
					let DAtipContainer = svg.append('g').attr('x', 0).attr('y', 0);
					let DAtip = DAtipContainer.append('g')
								.attr('class', 'DAtip')
								.attr('transform', `translate(${margin.left},${margin.top})`)
								.attr('display', 'none');
					DAtip.append('rect');
					DAtip.append('text').attr('width', 150).attr('height', 25)
							.attr('x', 0).attr('y', 25)
							.text(':').attr('text-anchor', 'start').attr('dominat-baseline', 'middle');
					// draw the DA nodes
					drawDA();
					// the DA nodes label
					drawDALabel();
					
					/* --------------- section --------------- */
					/*Draw the data Point nodes: prepare visual components and then call drawDT()*/
					// prepare DT tooltip components
					svg.append('rect').attr('class', 'tip-rect').attr("width", 80).attr("height", 200)
							.attr('fill', 'transparent')
							.attr('backgroundColor', d3.rgb(100,100,100)); // add tooltip container				
					let tooltipContainer = svg.append('g')
								.attr('class', 'tip')
								.attr('transform', `translate(${margin.left},${margin.top})`)
								.attr('display', 'none');
					// add multiple lines for each information			
					let tooltip = tooltipContainer.selectAll('text').data(titles)
							.enter().append('g').attr('x', 0).attr('y',function(d,i){return 25*i;});
							//.attr('transform', `translate(${0},${function(d,i){return 20*i}})`);
					tooltip.append('rect').attr('width', 150).attr('height', 25).attr('x', 0).attr('y',function(d,i){return 25*i;})
							//.attr('fill', 'transparent')
							.attr('fill', d3.rgb(200,200,200));
					tooltip.append('text').attr('width', 150).attr('height', 25).attr('x', 5).attr('y',function(d,i){return 25*(i+0.5);})
							.text(d=>d + ':').attr('text-anchor', 'start').attr('dominat-baseline', 'hanging');
					// plot each data node
					drawDT();
						
					/* --------------- section --------------- */
					/*Draw the legend: prepare data and then call drawLegend()*/				
					// plot the legend
					drawLegend();

					/* --------------- section --------------- */	
					// subfunctions
					// subfunction --> drawPanel(a): draw the big circle with the radius 'a'
					function drawPanel(a) {
						let panel = center.append('circle')
							.attr('class', 'big-circle')
							.attr('stroke', d3.rgb(0,0,0))
							.attr('stroke-width', 3)
							.attr('fill', 'transparent')
							.attr('r', a)
							.attr('cx', a)
							.attr('cy', a);
					}//end of function drawPanel()
					
					// subfunction --> drawDA(): draw the DA
					function drawDA(){
						center.selectAll('circle.DA-node').remove();
						let DANodes = center.selectAll('circle.DA-node')
							.data(DAdata)
							.enter().append('circle').attr('class', 'DA-node')
							.attr('fill', d3.rgb(120,120,120))
							.attr('stroke', d3.rgb(120,120,120))
							.attr('stroke-width', 1)
							.attr('r', radiusDA)
							.attr('cx', d => d.x)
							.attr('cy', d => d.y)
							.on('mouseenter', function(d){
								let damouse = d3.mouse(this); // get current mouse position
								svg.select('g.DAtip').select('text').text('(' + formatnumber((d.theta/Math.PI)*180) + ')').attr('fill', 'darkorange').attr('font-size', '18pt');
								svg.select('g.DAtip').attr('transform',  `translate(${margin.left + damouse[0] +0},${margin.top+damouse[1] - 50})`);
								svg.select('g.DAtip').attr('display', 'block');
							})
							.on('mouseout', function(d){
								svg.select('g.DAtip').attr('display', 'none');
							})
							.call(d3.drag()
								.on("start", dragstarted)
								.on("drag", dragged)
								.on("end", dragended)
							);
					}//end of function drawDA				

					// dragstarted, dragged, dragended
					function dragstarted(d){ 
						//div.select('.radviz-title a').attr('display', 'block');
						d3.select(this).raise().classed('active', true);
						//d3.select(this).attr('stroke', 'red').attr('stroke-width', 3);
					}
					function dragended(d){ 
						d3.select(this).classed('active', false);
						d3.select(this).attr('stroke-width', 0);
					}
					function dragged(d, i) {
						d3.select(this).raise().classed('active', true);
						//d3.select(this).attr('stroke', 'red').attr('stroke-width', 3);
						let tempx = d3.event.x - chartRadius;
						let tempy = d3.event.y - chartRadius;
						let newAngle = Math.atan2( tempy , tempx ) ;	
						if(newAngle<0){
							newAngle = 2*Math.PI + newAngle;
						}
						d.theta = newAngle;
						d.x = chartRadius + Math.cos(newAngle) * chartRadius;
						d.y = chartRadius + Math.sin(newAngle) * chartRadius;					
						//d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
						d3.select(this).attr('cx', d.x).attr('cy', d.y);
						// redraw the dimensional anchor and the label
						drawDA();
						drawDALabel();
						
						//update data points
						DA[i] = newAngle;
						calculateNodePosition();
						drawDT();
						
						//update histogram data and plot histogram
						Histdata = initializeHistData(dataE, colorclass, keys, binnumber);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
					}
					
					// subfunction --> drawDALabel(): draw the dimensional anchor label.
					function drawDALabel() {
						center.selectAll('text.DA-label').remove();
						let DANodesLabel = center.selectAll('text.DA-label')
							.data(DAdata).enter().append('text').attr('class', 'DA-label')
							.attr('x', d => d.x).attr('y', d => d.y)
							.attr('text-anchor', function(d) {
								if (Math.cos(d.theta) > 0) { return 'start';	}
								else { return 'end'; }
							})
							.attr('dominat-baseline', function(d) {
								if (Math.sin(d.theta) < 0) { return 'baseline';}
								else { return 'hanging'; }
							})
							.attr('dx', d => Math.cos(d.theta) * 15)
							.attr('dy', function (d) {
								if (Math.sin(d.theta) < 0) { return Math.sin(d.theta) * (15) ; }
								else { return Math.sin(d.theta) * (15)+ 10 ; }
							})
							.text(d => d.name)
							.attr('font-size', '18pt');					
					}//end of function drawDALabel

					// subfunction --> drawDT(): draw the data points.
					function drawDT(){
						center.selectAll('.circle-data').remove();
						let DTNodes = center.selectAll('.circle-data')
							.data(dataE).enter().append('circle').attr('class', 'circle-data')
							.attr('id', d=>d.index)
							.attr('r', radiusDT)
							.attr('fill', function(d){ 
								return d.color;
							})
							.attr('stroke', 'black')
							.attr('stroke-width', 0.5)
							.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius)
							.on('mouseenter', function(d) {
								let mouse = d3.mouse(this); //get current mouse position.
								let tip = svg.select('g.tip').selectAll('text').text(function(k, i){
									return k + ': ' + d[k];
								}); // edit tips text
								// move tips position
								svg.select('g.tip').attr('transform',  `translate(${margin.left + mouse[0] +20},${margin.top+mouse[1] - 120})`);
								// display the tip
								svg.select('g.tip').attr('display', 'block');
								// highlight the point
								d3.select(this).transition().attr('r', radiusDT*2)
									.attr('stroke-width', 3);	
								d3.select(this).moveToFront();	
							})
							.on('mouseout', function(d) {
								// close the tips.
								svg.select('g.tip').attr('display', 'none');
								// dis-highlight the point
								d3.select(this).transition().attr('r', radiusDT).attr('stroke-width', 0.5);
								d3.select(this).moveToBack();
								// so that big circle svg will not cover the data nodes.
								d3.select('circle.big-circle').moveToBack(); 
							});					
					}// end of function drawDT				
					
					// subfunction --> drawLegend()
					function drawLegend() {
						let heightLegend = 25, xLegend = margin.left+chartRadius*1.7, yLegend = 25;
						let legendcircle = center.selectAll('circle.legend').data(colorspace)
							.enter().append('circle').attr('class', 'legend')
							.attr('r', radiusDT)
							.attr('cx', xLegend)
							.attr('cy', (d, i) => i*yLegend)
							.attr('fill', d=>d);
						let legendtexts = center.selectAll('text.legend').data(colorclass)
							.enter().append('text').attr('class', 'legend')
							.attr('x', xLegend + 2 * radiusDT)
							.attr('y', (d, i) => i*yLegend+5)
							.text(d => d).attr('font-size', '16pt').attr('dominat-baseline', 'middle')
							.on('mouseover', function(d){
								//when mouse hover, other classes will be discolored.
								let tempa = d3.select('#radviz').selectAll('.circle-data');
								tempa.nodes().forEach((element) => {
									let tempb = element.getAttribute('id');
									if (dataE[tempb].class != d) {
										d3.select(element).attr('fill-opacity', 0.2).attr('stroke-width', 0);
									}
								});
							})
							.on('mouseout', function(d) {
								//when mouse move out, display normally.
								d3.select('#radviz').selectAll('.circle-data')
									.attr('fill-opacity', 1).attr('stroke-width', 0.5);
							});					
					}// end of function drawLegend()
					
				});// end of div.each(function(){})
			} // end of function chart(div)
			
			// input information?
			chart.margin = function(_) {
				if (!arguments.length) return margin;
				margin = _;
				return chart;
			};
			
			chart.width = function(_) {
				if (!arguments.length) return width;
				width = _;
				return chart;
			};

			chart.height = function(_) {
				if (!arguments.length) return height;
				height = _;
				return chart;
			};	

			chart.radiusDA = function(_) {
				if (!arguments.length) return radiusDA;
				radiusDA = _;
				return chart;
			};	

			chart.radiusDT = function(_) {
				if (!arguments.length) return radiusDT;
				radiusDT = _;
				return chart;
			};	
			
			return chart;
		}
		
		// Function for display histogram
		function pvhistogram(){
			let margin = {top:20, right:20, bottom:30, left:30},
				width = 600,
				height = 300;
			const brush = d3.brushX(); //define a brush
			//let brushRange;
			let x = d3.scaleLinear().range([0, (width-margin.left-margin.right)]),
				x_t = d3.scaleLinear().domain([0, 1]).range([0, (width-margin.left-margin.right)]),
				xdelta = 1/binnumber;
			let	y = d3.scaleLinear().rangeRound([height-margin.top-margin.bottom, 0]);	
		
			function histogram(div) {
				div.each(function() {
					let div = d3.select(this);
					let svg = div.append('svg').attr('id', 'histogram')
							.attr('width', width).attr('height', height)
							.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					// draw Axis X and Y
					drawHistAxis();
					// draw Bars
					drawHistBar();
					// draw Brush
					drawHistBrush();				
					
					/* --------------- section --------------- */
					/*subfunctions of histogram()*/
					//subfunction: drawHistAxis
					function drawHistAxis(){
						//x.domain(Histdata.map(function(d) { return d.index; }));
						x.domain([0, d3.max(Histdata, function(d) { return d.index; })+1]);
						y.domain([0, d3.max(Histdata, function(d) { return d.total; })]).nice();
						
						// x-axis
						svg.append('g').attr('class', 'axis')
							.attr('transform', 'translate(0,' + (height-margin.top-margin.bottom) + ')')
							.call(d3.axisBottom(x).ticks(11, "s")); 
						// y-axis
						svg.append('g').attr('class', 'axis')
							.call(d3.axisLeft(y).ticks(null, "s"));					
					}
					//subfunction: drawHistBar
					function drawHistBar() {
						// stacked bar chart
						const stackbar = svg.append('g').attr('class', 'bar').selectAll('g')
							.data(d3.stack().keys(colorclass)(Histdata));
						stackbar.enter().append('g')
							.attr('fill', function(d) { return nodecolor(d.key); })
							.attr('class', d=>d.key)
							.selectAll('rect')
							.data(function(d) { return d; })
							.enter().append('rect')
							.attr('class', 'bar')
							.attr('x', function(d) { return x(d.data.index); })
							.attr('y', function(d) { return y(d[1]); })
							.attr('height', function(d) { return y(d[0]) - y(d[1]); })
							.attr('width', function(d) { return (x(d.data.index+1) - x(d.data.index))*0.9; });						
					}
					//subfunction: drawHistBrush
					function drawHistBrush() {
						// plot brush
						brush.extent([[0, 0], [width-margin.right-margin.left, height-margin.top-margin.bottom]]);
						const gbrush = svg.append('g').attr('class', 'brush')
							.call(brush);					
					}
					
				});// end of div.each(function(){})
			} // end of function chart(div)
			
			// brush functions
			//brush.on('start.hist', function(){});//end of brush.on('start.hist')
			brush.on('brush.hist', function(){
				if (!d3.event.sourceEvent) return; // Only transition after input.
				if (!d3.event.selection) return; // Ignore empty selections.
				
				//attempt to read brush range
				let brushRange = d3.event.selection || d3.brushSelection(this);	
				brushRange = [Math.floor(brushRange[0]/x(1))*x(1), Math.ceil(brushRange[1]/x(1))*x(1)];
				if(d3.event.sourceEvent && d3.event.sourceEvent.type === 'mousemove') {
					d3.select(this).call(brush.move, brushRange);//,extents
				}
				// Fade all bars in the histogram not within the brush
				let tempa = d3.select(this.parentNode.parentNode).selectAll('rect.bar');
				tempa.nodes().forEach((k)=>{
					if (k.getAttribute('x') >= brushRange[0] && k.getAttribute('x') < brushRange[1] || (d3.event.selection === null)) {	d3.select(k).attr('opacity', '1');}
					else { d3.select(k).attr('opacity', '0.2'); }
				});
				// Fade all DTNodes in the RadViz not within the brush
				let tempb = d3.select('svg#radviz').selectAll('circle.circle-data');
				tempb.nodes().forEach((m)=>{
					let tempc = m.getAttribute('id'); //index
					if (x(dataE[tempc].histindex) >= brushRange[0] && x(dataE[tempc].histindex) < brushRange[1] || (d3.event.selection === null)) {	d3.select(m).attr('opacity', '1').attr('stroke-width', 1);}
					else { d3.select(m).attr('opacity', '0.2').attr('stroke-width', 0);; }
				});
				
			});//end of brush.on('brush.hist')
			brush.on('end.hist', function(){
				// Only transition after input. or Ignore empty selections.
				if (!d3.event.selection || !d3.event.sourceEvent) {
					let tempa = d3.select(this.parentNode.parentNode).selectAll('rect.bar');
					let tempb = d3.select('svg#radviz').selectAll('circle.circle-data');
					tempa.attr('opacity', '1');
					tempb.attr('opacity', '1').attr('stroke-width', 0.5);
				}
			});//end of brush.on('end.hist')
			
			//PolarViz Function !!!!!!
			d3.select('body').on('keypress', function(){
				//four parts: get x0&x1; keyboard; update data; redraw
				if (d3.event.key !== 'e' && d3.event.key !== 'E' && d3.event.key !== 'q' && d3.event.key !== 'Q' && d3.event.key !== 'w' && d3.event.key !== 'W' && d3.event.key !== 'a' && d3.event.key !== 'A' && d3.event.key !== 's' && d3.event.key !== 'S' && d3.event.key !== 'z' && d3.event.key !== 'Z' && d3.event.key !== 'x' && d3.event.key !== 'X') return;
				//get x0&x1
				const tempa = d3.select('svg#histogram').select('.brush');
				let brushRangeA = d3.event.selection || d3.brushSelection(tempa.node()),
					brushRangeB;
				let xleft 	= x_t.invert(brushRangeA[0]),
					xright = x_t.invert(brushRangeA[1]);
				//keyboard & update data
				if (d3.event.key == 'e' || d3.event.key == 'E') {
					let tempa = brushRangeA[1]/x(1) - brushRangeA[0]/x(1), //# of bins
						tempb = 0, // # of data points in Histdata
						tempc = 0, // average # of data points in each bin
						tempd;
					let tempArrayB = [], 
						tempArrayC = []; 
					
					Histdata.forEach((d, i)=>{
						if(i>=brushRangeA[0]/x(1) && i<brushRangeA[1]/x(1)) {
							tempb += d.total; 
							tempArrayB.push(d.total);
							tempArrayC.push(0);
						}
					});
					tempc = tempb / tempa;
					// find the target bar
					let tempe = 0, sum = tempArrayB[0];
					for (tempd = 1; tempd < tempArrayB.length+1; ++tempd) {
						while(tempd * tempc >= sum) {
							tempArrayC[tempe] = tempd-1+brushRangeA[0]/x(1);
							tempe++;
							sum += tempArrayB[tempe];
						}
					}
					
					// modify d.distH
					if (tempb > 0 && tempa > 0) {
						dataE.forEach((d,i)=>{
							if (d.histindex>=brushRangeA[0]/x(1) && d.histindex<brushRangeA[1]/x(1)) {
								d.distH = tempArrayC[d.histindex-(brushRangeA[0]/x(1))]*d.distH/d.histindex;
								d.histindex = tempArrayC[d.histindex-(brushRangeA[0]/x(1))];
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;				
							}
						});
						
						//redraw
						brushRangeB = brushRangeA;
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		
						Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);					
					}
					
				}//end of case e
				else if (d3.event.key == 'q' || d3.event.key == 'Q') {
					let xmin = 0;
					dataE.forEach((d)=>{
						if (d.distH < xleft && d.distH > xmin) { xmin = d.distH; }
					});
					if (xleft - xdelta > 0 && xleft - xdelta > xmin) {
						brushRangeB = [x_t(xleft - xdelta), x_t(xright - xdelta)];
						dataE.forEach((d, i)=>{
							if (d.distH > xleft && d.distH < xright) {
								d.distH = d.distH - xdelta;
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						});
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case q
				else if (d3.event.key == 'w' || d3.event.key == 'W') {
					let xmax = 1;
					dataE.forEach((d)=>{
						if (d.distH > xright && d.distH < xmax) { xmax = d.distH; }
					});
					if (xright + xdelta < 1 && xright + xdelta < xmax) {
						brushRangeB = [x_t(xleft + xdelta), x_t(xright + xdelta)];
						dataE.forEach((d, i)=>{
							if (d.distH > xleft && d.distH < xright) {
								d.distH = d.distH + xdelta;
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						});
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}
				}//end of case w
				else if (d3.event.key == 'a' || d3.event.key == 'A') {
					if (xleft - xdelta > 0) {
						brushRangeB = [x_t(xleft - xdelta), x_t(xright)];
						dataE.forEach((d, i)=>{
							//d.distH = d.dist;
							if (d.distH < xleft) { 
								d.distH = (d.distH * (xleft - xdelta))/xleft;	
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
							else if (d.distH > xleft && d.distH < xright) {
								d.distH = ((d.distH - xleft)*(xright - xleft + xdelta))/(xright - xleft) + (xleft - xdelta);
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						})
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}
				}//end of case a
				else if (d3.event.key == 's' || d3.event.key == 'S') {
					if (xleft + xdelta < xright) {
						brushRangeB = [x_t(xleft + xdelta), x_t(xright)];
						dataE.forEach((d, i)=>{
							//d.distH = d.dist;
							if (d.distH < xleft) { 
								d.distH = (d.distH * (xleft + xdelta))/xleft;	
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
							else if (d.distH > xleft && d.distH < xright) {
								d.distH = ((d.distH - xleft)*(xright - xleft - xdelta))/(xright - xleft) + (xleft + xdelta);
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						})
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case s
				else if (d3.event.key == 'z' || d3.event.key == 'Z') {
					if (xright - xdelta > xleft) {
						brushRangeB = [x_t(xleft), x_t(xright - xdelta)];
						dataE.forEach((d, i)=>{
							//d.distH = d.dist;
							if (d.distH > xright) { 
								d.distH = 1 + ((xright - xdelta - 1)*(d.distH - 1))/(xright - 1);	
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
							else if (d.distH > xleft && d.distH < xright) {
								d.distH = xleft + ((xright - xdelta - xleft)*(d.distH - xleft))/(xright - xleft);
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						})
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case z
				else if (d3.event.key == 'x' || d3.event.key == 'X') {
					if (xright + xdelta < 1) {
						brushRangeB = [x_t(xleft), x_t(xright + xdelta)];
						dataE.forEach((d, i)=>{
							if (d.distH > xright) { 
								d.distH = 1 + ((xright + xdelta - 1)*(d.distH - 1))/(xright - 1);	
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
							else if (d.distH > xleft && d.distH < xright) {
								d.distH = xleft + ((xright + xdelta - xleft)*(d.distH - xleft))/(xright - xleft);
								d.x0 = Math.cos(d.theta*Math.PI/180) * d.distH;
								d.y0 = Math.sin(d.theta*Math.PI/180) * d.distH;
							}
						})
						//redraw
						let tempa = d3.select('svg#radviz').selectAll('circle.circle-data');
						tempa.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
							
						let tempb = document.getElementById('BinInput').value;		Histdata = [];
						Histdata = initializeHistData(dataE, colorclass, keys, tempb);
						d3.select('svg#histogram').remove();
						PVHistogram.each(render);
						d3.select('svg#histogram').select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case x
			})
			
			// input information?
			histogram.margin = function(_) {
				if (!arguments.length) return margin;
				margin = _;
				return histogram;
			};
			
			histogram.width = function(_) {
				if (!arguments.length) return width;
				width = _;
				return histogram;
			};

			histogram.height = function(_) {
				if (!arguments.length) return height;
				height = _;
				return histogram;
			};	
				
			return histogram;
		}
				
		// Functions for display data table	and update click event.
		function pvtable(div) {
			div.each(function() {
				const table = d3.select(this).append('table').attr('class','table table-hover');

				const headers = table.append('thead').attr('class', 'table-header').append('tr').selectAll('th').data(titles);
				headers.enter().append('th')
					.text(function (d) { return d;})
					.merge(headers);
				const rows = table.append('tbody').selectAll('tr').data(DATA);
				const cells = rows.enter().append('tr')
					.on('mouseover', function(d,i) { 
						let tempa = d3.select('#radviz').selectAll('.circle-data');
						tempa.nodes().forEach((element) => { //here important 'tempa.nodes()'
							if (element.getAttribute('id') == i) {
								d3.select(element).transition().attr('r', radiusDT*2).attr('stroke-width', 3);
								d3.select(element).moveToFront();
							}
						});
					})
					.on('mouseout', function(d, i) {
						let tempa = d3.select('#radviz').selectAll('.circle-data');
						tempa.nodes().forEach((element) => {
							if (element.getAttribute('id') == i) {
								d3.select(element).transition().attr('r', radiusDT).attr('stroke-width', 0.5);
								d3.select(element).moveToBack();
								// so that big circle svg will not cover the data nodes.
								d3.select('circle.big-circle').moveToBack(); 
							}
						});					
					});
				cells.merge(rows);
				
				const cell = cells.selectAll('td').data(function(d){
					return titles.map(function(k){
						return {'value': d[k], 'name': k};
					});
				});
				cell.enter().append('td').text(d=>d.value)
					.merge(cell);
			});
		} // end of PVTable function
		
		// move element to the front
		d3.selection.prototype.moveToFront = function() {  
		  return this.each(function(){
			this.parentNode.appendChild(this);
		  });
		}
		// move element to the back
		d3.selection.prototype.moveToBack = function() {  
			return this.each(function() { 
				var firstChild = this.parentNode.firstChild; 
				if (firstChild) { 
					this.parentNode.insertBefore(this, firstChild); 
				} 
			});
		}		
	
		/////////////////////////////////////////////////////////
		// functions for data processing
		// Initialize the histdata
		function initializeHistData(dataE, colorclass, keys, number){	
			let data = [...Array.apply(null, {length: number}).map(Number.call, Number)]
				.map(e=>Array.apply(null, {length: colorclass.length+1}).fill(0));
			data.forEach((d,i)=>{d[0]=i;}); // add index
			let tempa = d3.scaleLinear().domain([0,1]).range([0, data.length]);
			dataE.forEach((d)=>{
				let tempb = Math.floor(tempa(d.distH))==number? number-1: Math.floor(tempa(d.distH));
				let tempc = colorspace.indexOf(d.color);
				++data[tempb][tempc+1];
				d.histindex = tempb;//to update the radviz in brush
			}); // add values
			
			data = data.map(function(d) {
				let tempa = {};
				keys.forEach(function(k, i){ 
					tempa[k] = d[i]; 
				});
				return tempa;
			});
			data.forEach((d)=>{
				let tempd=0;
				colorclass.forEach((k,i)=>{tempd += d[k];});
				d.total = tempd;
			});
			return data;
		}//end of function initializeHistData	
		// calculate DAdata based on the new radius
		function calculateDAdata(radius) {
			DAdata.forEach(function(d){
				d.x = radius * d.x + radius;
				d.y = radius * d.y + radius;
			});
			return DAdata;
		}// end of function calculateDAdata(radius)
		//calculate theta and r
		function calculateNodePosition() {
			dataE.forEach(function(d) {
				let dsum = d.dsum, dx = 0, dy = 0;
				dimensionNamesNormalized.forEach(function (k, i){ dx += Math.cos(DA[i])*d[k]; }); // dx
				dimensionNamesNormalized.forEach(function (k, i){ dy += Math.sin(DA[i])*d[k]; }); // dy
				d.x0 = dx/dsum;
				d.y0 = dy/dsum;
				d.dist 	= Math.sqrt(Math.pow(dx/dsum, 2) + Math.pow(dy/dsum, 2)); // calculate r
				d.distH = Math.sqrt(Math.pow(dx/dsum, 2) + Math.pow(dy/dsum, 2)); // calculate r
				d.theta = Math.atan2(dy/dsum, dx/dsum) * 180 / Math.PI; 
			});
			return dataE;
		} // end of function calculateNodePosition()
		//calculate dsum
		function calculateDataSum(data) {
			data.forEach(function(d) {
				let dsum = 0;
				dimensionNamesNormalized.forEach(function (k){ dsum += d[k]; }); // sum
				d.dsum = dsum;
			});
			return data;
		}// end of function calculateDataSum()
		// original data normalization
		function addNormalizedValues(data) {
			data.forEach(function(d) {
				dimensions.forEach(function(dimension) {
					d[dimension] = +d[dimension];
				});
			});
			var normalizationScales = {};
			dimensions.forEach(function(dimension) {
				normalizationScales[dimension] = d3.scaleLinear().domain(d3.extent(data.map(function(d, i) {
					return d[dimension];
				}))).range([0, 1]);
			});
			data.forEach(function(d) {
				dimensions.forEach(function(dimension) {
					d[dimension + '_normalized'] = normalizationScales[dimension](d[dimension]);
				});
			});
			return data;
		}// end of function addNormalizedValues(data)
	}

	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////	
	// handle input
	PV.TableTitle = function(_a) {
	if (!arguments.length) {return console.log("Input TableTitle")};
		TableTitle = _a;
		return PV;
	};
	PV.ColorAccessor = function(_a) {
		if (!arguments.length) return console.log("Input ColorAccessor");
		ColorAccessor = _a;
		return PV;
	};	
	PV.Dimensionality = function(_a) {
		if (!arguments.length) return console.log("Input Dimensionality");
		Dimensionality = _a;
		return PV;
	};
	PV.DAnchor = function(_a) {
		if (!arguments.length) return console.log("Input initial DAnchor");
		DAnchor = _a;
		return PV;
	};	
	PV.DATA = function(_a) {
		if (!arguments.length) return console.log("Input DATA");
		DATA = _a;
		return PV;
	};	
	
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	// return
	return PV;
};