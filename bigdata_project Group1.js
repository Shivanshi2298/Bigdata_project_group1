/*Classified into 4 classes : Water , Vegetation , Urban and Barrenland for Pune district of Maharashtra, India . 
This is a sample code for the year 2002 . Similar procedure was followed for the years 1992, 2012 and 2022.*/


var cloudMaskL457 = function(image) {
    var qa = image.select('pixel_qa');
    // If the cloud bit (5) is set and the cloud confidence (7) is high
    // or the cloud shadow bit is set (3), then it's a bad pixel.
    var cloud = qa.bitwiseAnd(1 << 5)
                    .and(qa.bitwiseAnd(1 << 7))
                    .or(qa.bitwiseAnd(1 << 3));
    // Remove edge pixels that don't occur in all bands
    var mask2 = image.mask().reduce(ee.Reducer.min());
    return image.updateMask(cloud.not()).updateMask(mask2);
  };
  
   var clip = function(image){
     return image.clip(pune);}
  
  function addNDVI(image) {
  var ndvi = image.normalizedDifference(['B4', 'B3']).rename('ndvi');
  return image.addBands(ndvi);
  }
  
  function addNDBI(image){
  var ndbi = image.normalizedDifference(['B5', 'B4']).rename('ndbi');
  return image.addBands(ndbi);
  }
  
  var l7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
                    .filterDate('2002-01-01', '2002-12-31')
                    .map(cloudMaskL457)
                     .map(clip)
                    .median();
  
  
  
  var visParams = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 3000,
    gamma: 1.4,
  };
  
  //Map.setCenter(77.580643, 12.972442, 10);
  Map.addLayer(l7, visParams);
  Map.addLayer(pune);
  l7 = addNDVI(l7)
  l7 = addNDBI(l7)
  l7 = l7.select(["B1", "B2", "B3" , "B4","B5", "B6" , "B7", "ndvi", "ndbi"])
  var band_names= l7.bandNames()
  print(band_names)
  
  //CLASSIFICATION
  //merging training points
  var training_points = water.merge(vegetation).merge(urban).merge(barrenland);
  
  
  //sampling the image
  var sampled_data = l7.sampleRegions({collection: training_points,
                                                    properties: ["LC"],
                                                    scale: 30}
                                                    );
                                                    
  //splitting the sampled data
  var random_column = sampled_data.randomColumn();
  var training_sample = random_column.filter(ee.Filter.gte("random",0.25));
  var validation_sample = random_column.filter(ee.Filter.lte("random",0.25));
  
                                                    
  //classifier_1
  //var smile_cart= ee.Classifier.smileCart();
  //classifier_2
  var classifier = ee.Classifier.smileRandomForest(50).train({features:training_sample,
                                          classProperty:'LC',
                                          inputProperties: band_names});
  
  //classification
  var classified = l7.classify(classifier);
  //visualisation of classified image
  Map.addLayer(classified,
  {min:0,max:3,
  palette:[ "blue", "green", "yellow", "grey"]},"Classified Image");
  
  //accuracy assessment
  var classified_1 = validation_sample.classify(classifier);
  var error_matrix = classified_1.errorMatrix({actual: "LC", predicted: "classification"});
  print(error_matrix);
  var total_accuracy = error_matrix.accuracy();
  print("Total Accuracy",total_accuracy);
  var user_accuracy = error_matrix.consumersAccuracy();
  print(user_accuracy, "Consumers Accuracy");
  var pro_accuracy = error_matrix.producersAccuracy();
  print(pro_accuracy, "Producer Accuracy");
  print("Kappa coefficent:", error_matrix.kappa());
  
  
  
  // exporting classified image
  /*Export.image.toAssets({
    image : classified,
    description : 'classified_2002',
    region : pune,
    scale : 20
    });*/
  //area calculation
  var all_classes_area = ee.Image.pixelArea().addBands(classified).divide(1e6)
                        .reduceRegion({
                          reducer: ee.Reducer.sum().group(1),
                          geometry: pune,
                          scale: 100,
                          bestEffort: true
                        })
  print(all_classes_area, 'All Classes Area in Square KM')
  
  
  // area chart
  var area_chart = ui.Chart.image.byClass({
                  image: ee.Image.pixelArea().addBands(classified).divide(1e6)  ,
                  classBand: 'classification',
                  region: pune,
                  reducer: ee.Reducer.sum(),
                  scale: 100,
  }).setSeriesNames(ee.List(['Water','Vegtation','Urban','BarrenLand']))
  .setSeriesNames(ee.List(['Water','Vegtation','Urban','Barren land'])).setOptions({ colors: ['blue',"green","red","grey"],
                    title: 'Area for the Respective Classes',
                    hAxis: {
                      title: 'Classes',
                      viewWindowMode: 'maximized',
                      titleTextStyle: {italic: false, bold: true}
                    },
                    vAxis: {
                      title: 'Urban Area(km^2)',
                       ticks: [
                        {v: 0},
                        {v: 1000},
                        {v: 2000},
                        {v: 3000},
                        {v: 4000},
                        {v: 5000},
                        {v: 6000},
                        {v: 7000},
                        {v: 8000},
                        {v: 9000}
                      ],
                      titleTextStyle: {italic: false, bold: true}
                    }
                  });
  print(area_chart)





  /* This is the code used for creation of dashboard */
  //visualization of the layers
/*
Map.addLayer(c1992,
{min:0,max:3, palette:[ "blue", "green", "red", "grey"]},"Classified 1992");
Map.addLayer(c2002,
{min:0,max:3, palette:[ "blue", "green", "red", "grey"]},"Classified 2002");
Map.addLayer(c2012,
{min:0,max:3, palette:[ "blue", "green", "red", "grey"]},"Classified 2012");
*/

var keys = {
    '1992':c1992,
    "2002":c2002,
    '2012':c2012,
    "2022":c2022
  }
  
  //Map.addLayer(keys['1992'], {min:0,max:3, palette:[ "blue", "green", "grey", "yellow"]},"classified Image2");
  
  
  //MAIN PANEL
  var mainPanel = ui.Panel({
    style: {width: '400px'}
  });
  //main panel label
  var title = ui.Label({
    value: 'URBAN GROWTH IN PUNE',
    style: {fontWeight: 'bold',fontSize: '24px'}
  });
  //main panel description
  var sec_title = ui.Label({
    value: "A platform to visualize the urbanisation in the past decades in Pune district.",
    style: {'fontSize': '18px',}
  })
  mainPanel.add(title).add(sec_title)   //titles added
  
  //Adding Panels to Main Panel - vertical
  //for lulc
  var verPanel1 = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
  });
  var lulc_title =ui.Label({
    value:"Landuse Landcover Change",
    style: {fontWeight: 'bold',fontSize: '15px'}
  })
  verPanel1.add(lulc_title)
  
  //adding a horizontal panel
  var dropdownPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
  });
  verPanel1.add(dropdownPanel);
  //widgets
  var tit_year =ui.Label({
    value:"Year:",
     style: {fontSize: '14px'}
  })
  var yearSelector = ui.Select({
    placeholder: 'please wait..'
    })
  var button1 = ui.Button('Load')
  //adding widgets to the panel
  dropdownPanel.add(tit_year).add(yearSelector).add(button1)
  
  // Let's add a dropdown with the years
  var years = ee.List.sequence(1992, 2022,10)
  // Dropdown items need to be strings
  var yearStrings = years.map(function(year){
    return ee.Number(year).format('%04d')
  })
  // Evaluate the results and populate the dropdown
  yearStrings.evaluate(function(yearList) {
    yearSelector.items().reset(yearList);
    yearSelector.setPlaceholder('select a year');
  })
  mainPanel.add(verPanel1);
  //calculation of the areas of the classes
  function area_class(image){
  // Divide the area image by 1e6 so area results are in Sq Km
  var areaImage = ee.Image.pixelArea().divide(1e6).addBands(image);
  // Calculate Area by Class
  // Using a Grouped Reducer
  var areas = areaImage.reduceRegion({
        reducer: ee.Reducer.sum().group({
        groupField: 1,
        groupName: 'classification',
      }),
      geometry: pune,
      scale: 100,
      tileScale: 4,
      maxPixels: 1e10
      }); 
  var classAreas = ee.List(areas.get('groups'))
  print(classAreas)
  }
  
  var dis_chart = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
  });
  verPanel1.add(dis_chart)
  
  // area chart
  function areaChart(image){
  var area_chart = ui.Chart.image.byClass({
                  image: ee.Image.pixelArea().addBands(image).divide(1e6),
                  classBand: 'classification',
                  region: pune,
                  reducer: ee.Reducer.sum(),
                  scale: 100, 
  }).setSeriesNames(ee.List(['Water','Vegetation','Urban','BarrenLand']))
  .setOptions({ colors: ['blue',"green","red","grey"],
                    title: 'Area for the Respective Classes',
                    hAxis: {
                      title: 'Classes',
                      viewWindowMode: 'maximized',
                      titleTextStyle: {italic: false, bold: true}
                    },
                    vAxis: {
                      title: 'Urban Area(km^2)',
                       ticks: [
                        {v: 0},
                        {v: 1000},
                        {v: 2000},
                        {v: 3000},
                        {v: 4000},
                        {v: 5000},
                        {v: 6000},
                        {v: 7000},
                        {v: 8000},
                        {v: 9000}
                      ],
                      titleTextStyle: {italic: false, bold: true}
                    }
                  });
  area_class(image)
  dis_chart.clear()
  dis_chart.add(area_chart)
  }
  
  
  function display(image,layername)
  {
   Map.clear();
   Map.addLayer(image ,{min:0,max:3, palette:[ "blue", "green", "red", "grey"]}, layername);
   areaChart(image)
  }
  
  //Defining a function to visualize the LULC
  var vis_lulc  = function() {
    var year = yearSelector.getValue();
    var layerName = year + "-LULC";
    display(keys[year],layerName)
  }
  button1.onClick(vis_lulc)
  
  
  //for change detection
  var verPanel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
  });
  mainPanel.add(verPanel2);
  
  var changedetc_title =ui.Label({
    value:"Change in the Urban Growth",
    style: {fontWeight: 'bold',fontSize: '15px'}
  })
  
  verPanel2.add(changedetc_title)
  
  //adding a horizontal panel
  var dropdownPanel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
  });
  
  verPanel2.add(dropdownPanel2);
  //widgets
  var from =ui.Label({
    value:"From",
     style: {fontSize: '14px'}
  })
  
  
  var yearSelector1 = ui.Select({
    placeholder: 'please wait..'
    })
    
  var to =ui.Label({
    value:"To",
     style: {fontSize: '14px'}
  })
  
  var yearSelector2 = ui.Select({
    placeholder: 'please wait..'
    })
  var button2 = ui.Button('Load')
  //adding widgets to the panel
  dropdownPanel2.add(from).add(yearSelector1).add(to).add(yearSelector2).add(button2)
  // Evaluate the results and populate the dropdown for selector 1 and 2
  yearStrings.evaluate(function(yearList) {
    yearSelector1.items().reset(yearList);
    yearSelector1.setPlaceholder('select a year');
  })
  yearStrings.evaluate(function(yearList) {
    yearSelector2.items().reset(yearList);
    yearSelector2.setPlaceholder('select a year');
  })
  
  //to calculate area of the urban classes
  function urban_area(year){
  var classified = keys[year]
  var urban = classified.eq(2)
  var areaImage = urban.multiply(ee.Image.pixelArea())
  var area = areaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: pune,
    scale: 100,
    maxPixels: 1e10
    })
  var urbanAreaSqKm = ee.Number(
    area.get('classification')).divide(1e6).round()
  //print(urbanAreaSqKm)
  return urbanAreaSqKm
  }
  //function to calculate the increase in the urban area
  var sid 
  function urban_increase(year1,year2){
    var a1=urban_area(year1)
    var a2=urban_area(year2)
    sid = a2.subtract(a1)
    //print(sid)
    return (sid)
  }
  //function to calculate the percentage of growth
  function urban_perc(year1,year2){
    var d = urban_increase(year1,year2)
    var a1=urban_area(year1)
    var s = d.divide(a1).multiply(100).round()
    //print(s)
    return s
  }
  
  
  
  //Visualising the urban changes
  function change(year1, year2){ 
  // Reclassification from 0-3 to 1-4
  var beforeClasses = keys[year1].remap([0, 1, 2, 3], [0, 0, 1, 0])
  var afterClasses = keys[year2].remap([0, 1, 2, 3], [0, 0, 1, 0])
  var changed = afterClasses.subtract(beforeClasses).neq(0)
  Map.clear()
  Map.addLayer(beforeClasses,{min:0, max:1 ,palette: ['white', 'orange']}, year1)
  Map.addLayer(afterClasses,{min:0, max:1 ,palette: ['white', 'orange']}, year2)
  Map.addLayer(changed, {min:0, max:1 ,palette: ['white', 'red']}, year1+" to "+ year2)
  }
  
  
  //to display the answers in the panel
  var ans_panel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
  });
  verPanel2.add(ans_panel)
  var ans_panel1 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
  });
  ans_panel.add(ans_panel1)
  var ans_panel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
  });
  ans_panel.add(ans_panel2)
  
  //defining function to visualize the change in lulc
  function vis_change(){
   var year1 = yearSelector1.getValue();
   var year2 = yearSelector2.getValue(); 
  
   change(year1, year2)
   //returning areas
   var area1 = ee.Number(urban_area(year1)).format('%.1f');
   var area2 = ee.Number(urban_area(year2)).format('%.1f');
   var inc = ee.Number(urban_increase(year1,year2)).format('%.1f');
   var perc = ee.Number(urban_perc(year1,year2)).format('%.1f');
   var inc_l = ui.Label()
   var inc_desc= ui.Label({value: "The increase in Urban Growth in (km^2): "})
   //Evaluate the results and populate the ans
   inc.evaluate(function(x) {
    inc_l.setValue(x);
  })
  var perc_l = ui.Label()
  var perc_desc= ui.Label({value: "The percentage increase in Urban Growth(%): "})
   //Evaluate the results and populate the ans
   perc.evaluate(function(x) {
    perc_l.setValue(x);
  })
  ans_panel1.clear()
  ans_panel2.clear()
  ans_panel1.add(inc_desc).add(inc_l)
  ans_panel2.add(perc_desc).add(perc_l)
  }
  
  button2.onClick(vis_change)
  
  //making an urban growth chart
  function urban_chart(){
  // Let's add a dropdown with the years
  var years = ee.List.sequence(1992, 2022,10)
  var area = ee.Array([314.60,525.24,1127.74,1359.12])
  
  var chart = ui.Chart.array.values({array: area, axis: 0, xLabels: years})
  .setOptions({
                    hAxis: {
                      title: 'Years',
                      viewWindowMode: 'maximized',
                      ticks: [
                        {v: 1992},
                        {v: 2002},
                        {v: 2012},
                        {v: 2022},
                      ],
                      titleTextStyle: {italic: false, bold: true,fontSize: '9px'}
                    },
                    vAxis: {
                      title: 'Urban Area(km^2)',
                      titleTextStyle: {italic: false, bold: true,fontSize: '9px'}
                    },
                    colors: ['39a8a7'],
                    lineWidth: 3,
                    pointSize: 7,
                    legend: {position: 'none'}
                  });
  return(chart);
  }
  
  //for urban growth chart
  var char_title = ui.Label({
    value: 'Decadal Urban Growth (1992 - 2022)',
    style: {fontWeight: 'bold',
      fontSize: '15px'}});
  var verPanel3 = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
  });
  mainPanel.add(verPanel3);
  
  var u_chart=urban_chart();
  verPanel3.add(char_title).add(u_chart)
  
  
  var legend = ui.Panel({style: {position: 'middle-right', padding: '8px 15px'}});
  
  var makeRow = function(color, name) {
    var colorBox = ui.Label({
      style: {color: '#ffffff',
        backgroundColor: color,
        padding: '10px',
        margin: '0 0 4px 0',
      }
    });
    var description = ui.Label({
      value: name,
      style: {
        margin: '0px 0 4px 6px',
      }
    }); 
    return ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')}
  )};
  
  var title = ui.Label({
    value: 'Legends',
    style: {fontWeight: 'bold',
      fontSize: '12px',
      margin: '0px 0 4px 0px'}});
      
  legend.add(title);
  legend.add(makeRow('blue','Water'))
  legend.add(makeRow('green','Vegetation'))
  legend.add(makeRow('red','Urban'))
  legend.add(makeRow('grey','Barren Land'))
  
  mainPanel.add(legend);
  
  Map.setCenter(73.856255, 18.516726, 8)
  ui.root.add(mainPanel)

//   App link 
https://imonga4.users.earthengine.app/view/urban-growth-detector-of-pune