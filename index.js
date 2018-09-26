// dataset: iris
d3.csv('./data/iris.data.csv', function(error, data) {
	if(error) throw(error);
	
	const titles = d3.keys(data[0]);//titles in the data table
	const colorAccessor = function(d){ return d['class']; };//dimension used for coloring
	const dimensions = ['sepalL', 'sepalW', 'petalL', 'petalW'];//dimensions used for RadViz.
	const dimensionAnchor = Array.apply(null, {length: dimensions.length}).map(Number.call, Number).map(x=>x*2*Math.PI/(dimensions.length)); // intial DA configration;
	
	//console.log('index.js:titles', titles);
	//console.log('index.js:colorAccessor', colorAccessor);
	//console.log('index.js:dimensions', dimensions);
	//console.log('index.js:dimensionAnchor', dimensionAnchor);
	
	// call the plot function
	PolarViz()
		.TableTitle(titles)
		.ColorAccessor(colorAccessor)
		.Dimensionality(dimensions)
		.DAnchor(dimensionAnchor)
		.DATA(data)
		.call();
}); 
