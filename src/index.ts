import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { march2020data, april2022data, ResultEntry } from "./stats";

const aProjection = d3Composite
  .geoConicConformalSpain() // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .attr("d", geoPath as any);

const calculateMaxAffected = (dataset: ResultEntry[]) => {
  return dataset.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );
};

const calculateAffectedRadiusScale = (maxAffected: number) => {
  return d3.scaleLinear().domain([0, maxAffected]).range([0, 20]);
};

const calculateRadiusBasedOnAffectedCases = (comunidad: string, dataset: ResultEntry[]) => 
{
  const maxAffected = calculateMaxAffected(dataset);
  const affectedRadiusScale = calculateAffectedRadiusScale(maxAffected);
  const entry = dataset.find((item) => item.name === comunidad);
  const adder = d3
    .scaleThreshold<number, number>()
    .domain([50000, 100000, 500000, 1000000, 5000000])
    .range([0.2, 0.4, 2, 4, 20]);

  return entry ? affectedRadiusScale(entry.value) + adder(maxAffected) : 0;
};

const updateChart = (dataset: ResultEntry[]) => {
  svg
    .selectAll("circle")
    .data(latLongCommunities)
    .attr("class", "affected-marker")
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1])
    .transition()
    .duration(500)
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, dataset));
};


document
  .getElementById("initial")
  .addEventListener("click", function handleInitialStats() {
    updateChart(march2020data);
  });


document
  .getElementById("final")
  .addEventListener("click", function handleFinalStats() {
    updateChart(april2022data);
  });


svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, march2020data));
