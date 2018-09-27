//fixed table headers
document.getElementById('data-table').addEventListener('scroll',function(){
   var translate = 'translate(0,'+this.scrollTop+'px)';
   this.querySelector('thead').style.transform = translate;
});

function PolarViz(){
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	// define var
	let DOMTable,
		DOMRadViz,
		DOMHistogram,
		TableTitle, 
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
		let RVmargin = {top:50, right:150, bottom:50, left:80},
			RVwidth = 600,
			RVheight = 450;		
		let chartRadius = Math.min((RVheight-RVmargin.top-RVmargin.bottom) , (RVwidth-RVmargin.left-RVmargin.right))/2;		
		let Histmargin = {top:20, right:20, bottom:30, left:30},
			Histwidth = 600,
			Histheight =300;
		const brush = d3.brushX(); // define a brush
		let x = d3.scaleLinear().range([0, (Histwidth-Histmargin.left-Histmargin.right)]),
			x_t = d3.scaleLinear().domain([0,1]).range([0, (Histwidth-Histmargin.left-Histmargin.right)]),
			y = d3.scaleLinear().rangeRound([Histheight-Histmargin.top-Histmargin.bottom, 0]);
			xdelta = 1/binnumber;
		
		/////////////////////////////////////////////////////////	
		// Data pre-processing
		var titles = TableTitle.slice(); // get the attributes name
		titles.unshift('index');
		// rewrite the data
		let dimensions = Dimensionality.slice(),
			normalizeSuffix = '_normalized',
			dimensionNamesNormalized = dimensions.map(function(d) { return d + normalizeSuffix; }), // 'sepalL_normalized'
			DN = dimensions.length,
			DA = DAnchor.slice(), // intial ;
			dataE = DATA.slice();//dataE, include more attributes.
		//dataE, include more attributes.
		dataE.forEach((d,i) => {
			d.index = i;
			d.id = i;
			d.color = nodecolor(ColorAccessor(d));
		});	
		dataE = addNormalizedValues(dataE);
		dataE = calculateNodePosition(dataE, dimensionNamesNormalized, DA); // calculateNodePosition. need update when DAs move.	
		
		// prepare the DA data 
		let DAdata = dimensions.map(function(d, i) {
			return {
				theta: DA[i], //[0, 2*PI]
				x: Math.cos(DA[i])*chartRadius+chartRadius,
				y: Math.sin(DA[i])*chartRadius+chartRadius,
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
		let Histdata = [];
		Histdata = initializeHistData(dataE, binnumber);	
		
		/////////////////////////////////////////////////////////
		// define the DOM components
		const table = d3.select(DOMTable).append('table').attr('class','table table-hover');
		
		const radviz = d3.select(DOMRadViz);
		let RVsvg = radviz.append('svg').attr('id', 'radviz')
			.attr('width', RVwidth)
			.attr('height', RVheight);						
		RVsvg.append('rect').attr('fill', 'transparent')
			.attr('width', RVwidth)
			.attr('height', RVheight);
		// transform a distance.(can treat as margin)
		let center = RVsvg.append('g').attr('class', 'center').attr('transform', `translate(${RVmargin.left},${RVmargin.top})`); 	
		// prepare the DA tips components
		RVsvg.append('rect').attr('class', 'DAtip-rect');			
		let DAtipContainer = RVsvg.append('g').attr('x', 0).attr('y', 0);
		let DAtip = DAtipContainer.append('g')
			.attr('class', 'DAtip')
			.attr('transform', `translate(${RVmargin.left},${RVmargin.top})`)
			.attr('display', 'none');
		DAtip.append('rect');
		DAtip.append('text').attr('width', 150).attr('height', 25)
			.attr('x', 0).attr('y', 25)
			.text(':').attr('text-anchor', 'start').attr('dominat-baseline', 'middle');	
		// prepare DT tooltip components
		RVsvg.append('rect').attr('class', 'tip-rect')
			.attr('width', 80).attr('height', 200)
			.attr('fill', 'transparent')
			.attr('backgroundColor', d3.rgb(100,100,100)); // add tooltip container				
		let tooltipContainer = RVsvg.append('g')
			.attr('class', 'tip')
			.attr('transform', `translate(${RVmargin.left},${RVmargin.top})`)
			.attr('display', 'none');

		const histogram =d3.select(DOMHistogram);
		let Histsvg = histogram.append('svg').attr('id', 'histogram')
			.attr('width', Histwidth).attr('height', Histheight)
			.append('g').attr('transform', 'translate(' + Histmargin.left + ',' + Histmargin.top + ')');
		let Xaxis = Histsvg.append('g').attr('class', 'axis')
			.attr('transform', 'translate(0,' + (Histheight-Histmargin.top-Histmargin.bottom) + ')'),
			Yaxis = Histsvg.append('g').attr('class', 'axis'),
			stackbar = Histsvg.append('g').attr('class', 'bar'),
			gbrush = Histsvg.append('g').attr('class', 'brush');
		
		/////////////////////////////////////////////////////////
		//Render the list.
		const PVTable 		= d3.select(DOMTable).data([pvtable]);
		//Render the radviz
		const PVRadviz		= d3.select(DOMRadViz).data([pvradviz()]);
		//Render the histogram
		const PVHistogram 	= d3.select(DOMHistogram).data([pvhistogram()]);
		
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
			// re-intialized all data and then calculate
			DA = DAnchor.slice();
			DAdata = dimensions.map(function(d, i) {
				return {
					theta: DA[i], //[0, 2*PI]
					x: Math.cos(DA[i])*chartRadius+chartRadius,
					y: Math.sin(DA[i])*chartRadius+chartRadius,
					fixed: true,
					name: d
					};
			});	//DAdata is based on DA.
			calculateNodePosition(dataE, dimensionNamesNormalized, DA);	
			//Histdata = [];
			Histdata = initializeHistData(dataE, binnumber);			
			//re-rendering
			renderAll();
		} /* 	*/	
			
		// add event listeners
		document.getElementById('resetPolarViz').onclick = function() {resetPolarViz()};
		// reset PolarViz
		function resetPolarViz() {
			DAdata = dimensions.map(function(d, i) {
				return {
					theta: DA[i], //[0, 2*PI]
					x: Math.cos(DA[i])*chartRadius+chartRadius,
					y: Math.sin(DA[i])*chartRadius+chartRadius,
					fixed: true,
					name: d
					};
			});		
			calculateNodePosition(dataE, dimensionNamesNormalized, DA);	
			Histdata = initializeHistData(dataE, binnumber);			
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
			//renew the binnumber
			binnumber = tempa;
			//clear data
			Histdata = initializeHistData(dataE, tempa);
			PVHistogram.each(render);
		}

		/////////////////////////////////////////////////////////
		// Function for display radviz
		function pvradviz(){		
			function chart(div) {
				div.each(function() {
					/* --------------- section --------------- */
					/*Draw the big circle: drawPanel(chartRadius)*/
					// The default setting: 'stroke='black' stroke-width='3''
					drawPanel(chartRadius);
					
					/* --------------- section --------------- */
					/*Draw the Dimensional Anchor nodes: tips components, and then call drawDA() to draw DA points, and call drawDALabel to draw DA labels*/
					// draw the DA nodes
					drawDA();
					// the DA nodes label
					drawDALabel();
					
					/* --------------- section --------------- */
					/*Draw the data Point nodes: prepare visual components and then call drawDT()*/
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
								RVsvg.select('g.DAtip').select('text').text('(' + formatnumber((d.theta/Math.PI)*180) + ')').attr('fill', 'darkorange').attr('font-size', '18pt');
								RVsvg.select('g.DAtip').attr('transform',  `translate(${RVmargin.left + damouse[0] +0},${RVmargin.top+damouse[1] - 50})`);
								RVsvg.select('g.DAtip').attr('display', 'block');
							})
							.on('mouseout', function(d){
								RVsvg.select('g.DAtip').attr('display', 'none');
							})
							.call(d3.drag()
								.on('start', dragstarted)
								.on('drag', dragged)
								.on('end', dragended)
							);
					}//end of function drawDA				

					// dragstarted, dragged, dragended
					function dragstarted(d){ 
						d3.select(this).raise().classed('active', true);
					}
					function dragended(d){ 
						d3.select(this).classed('active', false);
						d3.select(this).attr('stroke-width', 0);
					}
					function dragged(d, i) {
						d3.select(this).raise().classed('active', true);
						let tempx = d3.event.x - chartRadius;
						let tempy = d3.event.y - chartRadius;
						let newAngle = Math.atan2( tempy , tempx ) ;	
						newAngle = newAngle<0? 2*Math.PI + newAngle : newAngle;
						d.theta = newAngle;
						d.x = chartRadius + Math.cos(newAngle) * chartRadius;
						d.y = chartRadius + Math.sin(newAngle) * chartRadius;
						d3.select(this).attr('cx', d.x).attr('cy', d.y);
						// redraw the dimensional anchor and the label
						drawDA();
						drawDALabel();
						
						//update data points
						DA[i] = newAngle;
						calculateNodePosition(dataE, dimensionNamesNormalized, DA);
						drawDT();
						
						//update histogram data and plot histogram
						Histdata = initializeHistData(dataE, binnumber);
						PVHistogram.each(render);
					}
					
					// subfunction --> drawDALabel(): draw the dimensional anchor label.
					function drawDALabel() {
						center.selectAll('text.DA-label').remove();
						let DANodesLabel = center.selectAll('text.DA-label')
							.data(DAdata).enter().append('text').attr('class', 'DA-label')
							.attr('x', d => d.x).attr('y', d => d.y)
							.attr('text-anchor', d=>Math.cos(d.theta)>0?'start':'end')
							.attr('dominat-baseline', d=>Math.sin(d.theta)<0?'baseline':'hanging')
							.attr('dx', d => Math.cos(d.theta) * 15)
							.attr('dy', d=>Math.sin(d.theta)<0?Math.sin(d.theta)*(15):Math.sin(d.theta)*(15)+ 10)
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
							.attr('fill', d=>d.color)
							.attr('stroke', 'black')
							.attr('stroke-width', 0.5)
							.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius)
							.on('mouseenter', function(d) {
								let mouse = d3.mouse(this); //get current mouse position.
								let tip = RVsvg.select('g.tip').selectAll('text').text(function(k, i){
									return k + ': ' + d[k];
								}); // edit tips text
								// move tips position
								RVsvg.select('g.tip').attr('transform',  `translate(${RVmargin.left + mouse[0] +20},${RVmargin.top+mouse[1] - 120})`);
								// display the tip
								RVsvg.select('g.tip').attr('display', 'block');
								// highlight the point
								d3.select(this).raise().transition().attr('r', radiusDT*2).attr('stroke-width', 3);	
							})
							.on('mouseout', function(d) {
								// close the tips.
								RVsvg.select('g.tip').attr('display', 'none');
								// dis-highlight the point
								d3.select(this).transition().attr('r', radiusDT).attr('stroke-width', 0.5);
							});					
					}// end of function drawDT				
					
					// subfunction --> drawLegend()
					function drawLegend() {
						let heightLegend = 25, xLegend = RVmargin.left+chartRadius*1.7, yLegend = 25;
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
								let tempa = d3.select(DOMRadViz).selectAll('.circle-data');
								tempa.nodes().forEach((element) => {
									let tempb = element.getAttribute('id');
									if (dataE[tempb].class != d) {
										d3.select(element).attr('fill-opacity', 0.2).attr('stroke-width', 0);
									}
								});
							})
							.on('mouseout', function(d) {
								//when mouse move out, display normally.
								d3.select(DOMRadViz).selectAll('.circle-data')
									.attr('fill-opacity', 1).attr('stroke-width', 0.5);
							});					
					}// end of function drawLegend()
					
				});// end of div.each(function(){})
			} // end of function chart(div)
			return chart;
		}
		
		// Function for display histogram
		function pvhistogram(){		
			function histogram(div) {
				div.each(function() {	
					console.log('Histdata', Histdata);
					x.domain([0, d3.max(Histdata, function(d) { return d.index; })+1]);
					y.domain([0, d3.max(Histdata, function(d) { return d.total; })]).nice();
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
						// x-axis
						Xaxis.call(d3.axisBottom(x).ticks(11, 's')); 
						// y-axis
						Yaxis.call(d3.axisLeft(y).ticks(null, 's'));					
					}
					//subfunction: drawHistBar
					function drawHistBar() {
						stackbar.selectAll('g#colorgroup').remove();
						// stacked bar chart
						let tempa = stackbar.selectAll('g#colorgroup').data(d3.stack().keys(colorclass)(Histdata)).enter()
							.append('g').attr('id', 'colorgroup')
							.attr('fill', d=>nodecolor(d.key))
							.attr('class', d=>d.key)
							.selectAll('rect').data(function(d) { return d; })
							.enter().append('rect')
							.attr('class', 'bar')
							.attr('x', function(d) {return x(d.data.index);})
							.attr('y', function(d) {return y(d[1]);})
							.attr('height', function(d){return y(d[0])-y(d[1]);})
							.attr('width', d=> (x(d.data.index+1) - x(d.data.index))*0.9);
						//tempa.merge(tempa);						
					}
					//subfunction: drawHistBrush
					function drawHistBrush() {
						// plot brush
						brush.extent([[0, 0], [Histwidth-Histmargin.right-Histmargin.left, Histheight-Histmargin.top-Histmargin.bottom]]);
						gbrush.call(brush);					
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
				let tempa = d3.select(DOMHistogram).selectAll('rect.bar');
				tempa.nodes().forEach((k)=>{
					if (k.getAttribute('x') >= brushRange[0] && k.getAttribute('x') < brushRange[1] || (d3.event.selection === null)) {	d3.select(k).attr('opacity', '1');}
					else { d3.select(k).attr('opacity', '0.2'); }
				});
				// Fade all DTNodes in the RadViz not within the brush
				let tempb = d3.select(DOMRadViz).selectAll('circle.circle-data');
				tempb.nodes().forEach((m)=>{
					let tempc = m.getAttribute('id'); //index
					if (x(dataE[tempc].histindex) >= brushRange[0] && x(dataE[tempc].histindex) < brushRange[1] || (d3.event.selection === null)) {	d3.select(m).attr('opacity', '1').attr('stroke-width', 1);}
					else { d3.select(m).attr('opacity', '0.2').attr('stroke-width', 0);}
				});
				
			});//end of brush.on('brush.hist')
			brush.on('end.hist', function(){
				// Only transition after input. or Ignore empty selections.
				if (!d3.event.selection || !d3.event.sourceEvent) {
					let tempa = d3.select(DOMHistogram).selectAll('rect.bar');
					let tempb = d3.select(DOMRadViz).selectAll('circle.circle-data');
					tempa.attr('opacity', '1');
					tempb.attr('opacity', '1').attr('stroke-width', 0.5);
				}
			});//end of brush.on('end.hist')
			
			//PolarViz Function !!!!!!
			d3.select('body').on('keypress', function(){
				//four parts: get x0&x1; keyboard; update data; redraw
				if (d3.event.key !== 'e' && d3.event.key !== 'E' && d3.event.key !== 'q' && d3.event.key !== 'Q' && d3.event.key !== 'w' && d3.event.key !== 'W' && d3.event.key !== 'a' && d3.event.key !== 'A' && d3.event.key !== 's' && d3.event.key !== 'S' && d3.event.key !== 'z' && d3.event.key !== 'Z' && d3.event.key !== 'x' && d3.event.key !== 'X') return;
				//get x0&x1
				const tempa = d3.select(DOMHistogram).select('.brush');
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
						brushRangeB = brushRangeA;	
						//redraw
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);		
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
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;	
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
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
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;	
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
					}
				}//end of case w
				else if (d3.event.key == 'a' || d3.event.key == 'A') {
					if (xleft - xdelta > 0) {
						brushRangeB = [x_t(xleft - xdelta), x_t(xright)];
						dataE.forEach((d, i)=>{
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
						});
						//redraw
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
					}
				}//end of case a
				else if (d3.event.key == 's' || d3.event.key == 'S') {
					if (xleft + xdelta < xright) {
						brushRangeB = [x_t(xleft + xdelta), x_t(xright)];
						dataE.forEach((d, i)=>{
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
						});
						//redraw
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;	
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case s
				else if (d3.event.key == 'z' || d3.event.key == 'Z') {
					if (xright - xdelta > xleft) {
						brushRangeB = [x_t(xleft), x_t(xright - xdelta)];
						dataE.forEach((d, i)=>{
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
						});
						//redraw
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
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
						});
						//redraw
						let tempc = d3.select(DOMRadViz).selectAll('circle.circle-data');
						tempc.attr('cx', d => d.x0*chartRadius + chartRadius)
							.attr('cy', d => d.y0*chartRadius + chartRadius);
						let tempb = document.getElementById('BinInput').value;
						Histdata = initializeHistData(dataE, tempb);
						PVHistogram.each(render);
						d3.select(DOMHistogram).select('.brush').call(brush.move, brushRangeB);
					}				
				}//end of case x						
			})
			return histogram;
		}
				
		// Functions for display data table	and update click event.
		function pvtable(div) {
			div.each(function() {
				const headers = table.append('thead').attr('class', 'table-header').append('tr').selectAll('th').data(titles);
				headers.exit().remove();
				headers.enter().append('th')
					.text(d=>d)
					.merge(headers);
				const rows = table.append('tbody').selectAll('tr').data(DATA);
				rows.exit().remove();
				const cells = rows.enter().append('tr')
					.on('mouseover', function(d,i) { 
						let tempa = d3.select(DOMRadViz).selectAll('.circle-data');
						tempa.nodes().forEach((element) => { 
							if (element.getAttribute('id') == i) {
								d3.select(element).transition().attr('r', radiusDT*2).attr('stroke-width', 3);
							}
						});
					})
					.on('mouseout', function(d, i) {
						let tempa = d3.select(DOMRadViz).selectAll('.circle-data');
						tempa.nodes().forEach((element) => {
							if (element.getAttribute('id') == i) {
								d3.select(element).transition().attr('r', radiusDT).attr('stroke-width', 0.5);
							}
						});					
					});
				cells.merge(rows);
				
				const cell = cells.selectAll('td').data(function(d){
					return titles.map(function(k){
						return {'value': d[k], 'name': k};
					});
				});
				cell.exit().remove();
				cell.enter().append('td').text(d=>d.value)
					.merge(cell);
			});
		} // end of PVTable function		
	
		/////////////////////////////////////////////////////////
		// functions for data processing
		// Initialize the histdata
		function initializeHistData(dataE, number){	
			let colorclass=[], colorspace=[];
			dataE.forEach(function(d,i){
				if(colorspace.indexOf(d.color)<0) {
					colorspace.push(d.color);
					colorclass.push(d.class);
				}
			});
			let keys = colorclass.slice();
			keys.unshift('index');			
			
			let data = [...Array.apply(null, {length: number}).map(Number.call, Number)].map(e=>Array.apply(null, {length: colorclass.length+1}).fill(0));
			data.forEach((d,i)=>{d[0]=i;}); // add index
			let tempa = d3.scaleLinear().domain([0,1]).range([0, data.length]);

			//console.log('test v2:', keys);
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
		//calculate theta and r
		function calculateNodePosition(dataE, dimensionNamesNormalized, DA) {
			dataE.forEach(function(d) {
				let dsum = d.dsum, dx = 0, dy = 0;
				dimensionNamesNormalized.forEach(function (k, i){ 
					dx += Math.cos(DA[i])*d[k]; 
					dy += Math.sin(DA[i])*d[k]; }); // dx & dy
				d.x0 = dx/dsum;
				d.y0 = dy/dsum;
				d.dist 	= Math.sqrt(Math.pow(dx/dsum, 2) + Math.pow(dy/dsum, 2)); // calculate r
				d.distH = Math.sqrt(Math.pow(dx/dsum, 2) + Math.pow(dy/dsum, 2)); // calculate r
				d.theta = Math.atan2(dy/dsum, dx/dsum) * 180 / Math.PI; 
			});
			return dataE;
		} // end of function calculateNodePosition()
		// original data normalization and dsum
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
			data.forEach(function(d) {
				let dsum = 0;
				dimensionNamesNormalized.forEach(function (k){ dsum += d[k]; }); // sum
				d.dsum = dsum;
			});			
			return data;
		}// end of function addNormalizedValues(data)
	}

	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////	
	// handle input
	PV.DOMTable = function(_a) {
	if (!arguments.length) {return console.log('No Table DOM')};
		DOMTable = _a;
		return PV;
	};
	PV.DOMRadViz = function(_a) {
	if (!arguments.length) {return console.log('No RadViz DOM')};
		DOMRadViz = _a;
		return PV;
	};
	PV.DOMHistogram = function(_a) {
	if (!arguments.length) {return console.log('No Histogram DOM')};
		DOMHistogram = _a;
		return PV;
	};
	PV.TableTitle = function(_a) {
	if (!arguments.length) {return console.log('Input TableTitle')};
		TableTitle = _a;
		return PV;
	};
	PV.ColorAccessor = function(_a) {
		if (!arguments.length) return console.log('Input ColorAccessor');
		ColorAccessor = _a;
		return PV;
	};	
	PV.Dimensionality = function(_a) {
		if (!arguments.length) return console.log('Input Dimensionality');
		Dimensionality = _a;
		return PV;
	};
	PV.DAnchor = function(_a) {
		if (!arguments.length) return console.log('Input initial DAnchor');
		DAnchor = _a;
		return PV;
	};	
	PV.DATA = function(_a) {
		if (!arguments.length) return console.log('Input DATA');
		DATA = _a;
		return PV;
	};	
	
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////
	// return
	return PV;
};