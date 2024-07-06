/// <reference types="vite/client" />
import { el } from "redom";
import * as echarts from "echarts/core";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { GraphChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([TitleComponent, TooltipComponent, LegendComponent, GraphChart, CanvasRenderer]);

const main = el("div") as HTMLElement;
document.body.append(main);
main.style.width = "800px";
main.style.height = "600px";

var myChart = echarts.init(main);

import rawData from "../data/data.json?raw";
const data = JSON.parse(rawData) as { [key: string]: string[] };

const nodeSet: Set<string> = new Set();
for (let i in data) {
    nodeSet.add(i);
    for (let f of data[i]) {
        nodeSet.add(f);
    }
}

const nodes = Array.from(nodeSet);

const edge: { source: string; target: string }[] = [];
for (let i in data) {
    for (let f of data[i]) {
        edge.push({ source: f, target: i });
    }
}

const categories: string[] = Array.from(new Set(nodes.map((i) => i.split(".")[0])));

console.log(categories);

const g = Object.groupBy(nodes, (i) => i.split(".")[0]);
console.log(g);

const c: { [k: string]: { x: number; y: number } } = {
    Algebra: { x: 1, y: 0.4 },
    Data: { x: 1, y: 0.5 },
    RingTheory: { x: 1, y: 0.3 },
    Order: { x: 1, y: 0.5 },
    LinearAlgebra: { x: 1, y: 0.55 },
    Init: { x: 0, y: 0.5 },
    Control: { x: 1, y: 0 },
    Logic: { x: 1, y: 0.6 },
    Mathport: { x: 1, y: 1 },
    NumberTheory: { x: 1, y: 0.5 },
    GroupTheory: { x: 1, y: 0.2 },
    SetTheory: { x: 1, y: 0.6 },
    AlgebraicGeometry: { x: 1, y: 0.6 },
    CategoryTheory: { x: 1, y: 0.7 },
    Geometry: { x: 1, y: 0.65 },
    Topology: { x: 1, y: 0.85 },
    AlgebraicTopology: { x: 1, y: 0.8 },
    Analysis: { x: 1, y: 0.75 },
    MeasureTheory: { x: 1, y: 0.9 },
    Combinatorics: { x: 1, y: 0.1 },
    Computability: { x: 1, y: 0.65 },
    Condensed: { x: 1, y: 0.8 },
    Deprecated: { x: 1, y: 1 },
    Dynamics: { x: 1, y: 1 },
    FieldTheory: { x: 1, y: 0.2 },
    InformationTheory: { x: 1, y: 0.1 },
    ModelTheory: { x: 1, y: 0.35 },
    Probability: { x: 1, y: 1 },
    RepresentationTheory: { x: 1, y: 0.35 },
};

function topologicalSort(graph: { [k: string]: string[] }) {
    const visited = new Set();
    const stack: string[] = [];

    function dfs(node: string) {
        visited.add(node);
        if (graph[node]) {
            for (let neighbor of graph[node]) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            }
        }
        stack.unshift(node);
    }

    // Perform DFS for each unvisited node
    for (let node in graph) {
        if (!visited.has(node)) {
            dfs(node);
        }
    }

    return stack;
}

function countDegrees(graph) {
    const indegree = {};
    const outdegree = {};

    // Initialize degrees
    for (let node in graph) {
        if (!(node in indegree)) {
            indegree[node] = 0;
        }
        if (!(node in outdegree)) {
            outdegree[node] = 0;
        }
        for (let neighbor of graph[node]) {
            if (!(neighbor in indegree)) {
                indegree[neighbor] = 0;
            }
            if (!(neighbor in outdegree)) {
                outdegree[neighbor] = 0;
            }
            // Increment outdegree for node and indegree for neighbor
            outdegree[node]++;
            indegree[neighbor]++;
        }
    }

    return { outdegree, indegree };
}

const { outdegree, indegree } = countDegrees(data);

const nodesss = topologicalSort(data).reverse();

const n = nodes.map((i) => {
    const x = i.split(".")[0];
    const v = outdegree[i] + indegree[i];
    return {
        id: i,
        name: i,
        symbolSize: 1 * v,
        value: v,
        x: (nodesss.indexOf(i) / nodesss.length) * 800,
        y: c[x].y * 600 + 10 * Math.random(),
        category: categories.indexOf(x),
    };
});

myChart.showLoading();

function show(lan: string) {
    fetch(`./lan/${lan}.json`)
        .then((i) => i.json())
        .then((j) => {
            n.forEach(
                (i) =>
                    (i.name =
                        j[i.name] ||
                        i.name
                            .split(".")
                            .map((x) => j[x] || x)
                            .join(".") ||
                        i.name)
            );

            showChart();
        });
}

function showChart() {
    myChart.hideLoading();
    myChart.setOption(
        {
            legend: [
                {
                    data: categories,
                },
            ],
            series: [
                {
                    type: "graph",
                    layout: "none",
                    symbol: "circle",
                    data: n,
                    links: edge,
                    categories: categories.map((i) => ({ name: i })),
                    label: {
                        position: "right",
                        formatter: "{b}",
                    },
                    roam: true,
                    labelLayout: {
                        hideOverlap: true,
                    },
                    scaleLimit: {
                        min: 0.4,
                    },
                    lineStyle: {
                        color: "source",
                        curveness: 0.1,
                        width: 0.1,
                    },
                },
            ],
        },
        true
    );
}

show("zh-HANS");

myChart.on("click", (e) => {
    if (e.dataType === "node") showWiki(e.data["id"]);
});

const wikiEl = el("div");
document.body.append(wikiEl);

function showWiki(id: string) {
    wikiEl.innerText = "";
    const name = n.find((i) => i.id === id).name;
    wikiEl.append(el("h2", name), el("p", id));
}
