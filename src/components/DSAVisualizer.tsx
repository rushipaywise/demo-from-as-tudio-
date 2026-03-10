import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Terminal, Box } from 'lucide-react';

interface VisualizerProps {
  type: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence' | 'constraints';
  data: any;
}

export const DSAVisualizer: React.FC<VisualizerProps> = ({ type, data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode] = useState<'d3' | 'ascii'>('ascii');

  useEffect(() => {
    if (!svgRef.current || !data || mode === 'ascii') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;

    if (type === 'array' || type === 'set') {
      const items = Array.isArray(data) ? data : (data.items || []);
      const x = d3.scaleBand()
        .domain(items.map((_: any, i: number) => i.toString()))
        .range([50, width - 50])
        .padding(0.1);

      const g = svg.append("g");

      const rects = g.selectAll("rect")
        .data(items)
        .enter()
        .append("rect")
        .attr("x", (_: any, i: number) => x(i.toString())!)
        .attr("y", height / 2 - 25)
        .attr("width", x.bandwidth())
        .attr("height", 50)
        .attr("fill", "#10b981")
        .attr("rx", 8);

      g.selectAll("text")
        .data(items)
        .enter()
        .append("text")
        .attr("x", (_: any, i: number) => x(i.toString())! + x.bandwidth() / 2)
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .text((d: any) => d.toString());
        
      // Animation
      rects.transition()
        .duration(500)
        .attr("fill", (d: any, i: number) => (data.activeIndex === i || data.currentIndex === i) ? "#f59e0b" : "#10b981");

      if (data.complement !== undefined) {
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height - 30)
          .attr("text-anchor", "middle")
          .attr("fill", "#6366f1")
          .attr("font-size", "12px")
          .text(`Searching for complement: ${data.complement}`);
      }

    } else if (type === 'hashmap') {
      const entries = Object.entries(data.map || {});
      const g = svg.append("g").attr("transform", "translate(50, 50)");

      g.selectAll("g")
        .data(entries)
        .enter()
        .append("g")
        .attr("transform", (_: any, i: number) => `translate(0, ${i * 40})`)
        .each(function([key, val]: [string, any]) {
          const row = d3.select(this);
          row.append("rect")
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#6366f1")
            .attr("rx", 4);
          row.append("text")
            .attr("x", 50)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(key);
          
          row.append("line")
            .attr("x1", 100)
            .attr("y1", 15)
            .attr("x2", 150)
            .attr("y2", 15)
            .attr("stroke", "#94a3b8");

          row.append("rect")
            .attr("x", 150)
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#ec4899")
            .attr("rx", 4);
          row.append("text")
            .attr("x", 200)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(val.toString());
        });
    } else if (type === 'sequence') {
      const items = data.items || [];
      const sequence = data.activeSequence || [];
      
      const x = d3.scaleBand()
        .domain(items.map((_: any, i: number) => i.toString()))
        .range([50, width - 50])
        .padding(0.2);

      const g = svg.append("g");

      g.selectAll("rect")
        .data(items)
        .enter()
        .append("rect")
        .attr("x", (_: any, i: number) => x(i.toString())!)
        .attr("y", height / 2 - 20)
        .attr("width", x.bandwidth())
        .attr("height", 40)
        .attr("fill", (d: any) => sequence.includes(d) ? "#10b981" : "#334155")
        .attr("rx", 4);

      g.selectAll("text")
        .data(items)
        .enter()
        .append("text")
        .attr("x", (_: any, i: number) => x(i.toString())! + x.bandwidth() / 2)
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text((d: any) => d.toString());
        
      if (sequence.length > 1) {
        for (let i = 0; i < sequence.length - 1; i++) {
            const startIdx = items.indexOf(sequence[i]);
            const endIdx = items.indexOf(sequence[i+1]);
            if (startIdx !== -1 && endIdx !== -1) {
                g.append("line")
                    .attr("x1", x(startIdx.toString())! + x.bandwidth())
                    .attr("y1", height / 2)
                    .attr("x2", x(endIdx.toString())!)
                    .attr("y2", height / 2)
                    .attr("stroke", "#10b981")
                    .attr("stroke-width", 2)
                    .attr("marker-end", "url(#arrow)");
            }
        }
      }
    } else if (type === 'constraints') {
      const constraints = data.constraints || [];
      const edgeCases = data.edgeCases || [];
      
      const g = svg.append("g").attr("transform", "translate(50, 40)");

      g.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#10b981")
        .attr("font-weight", "bold")
        .attr("font-size", "14px")
        .text("SYSTEM CONSTRAINTS");

      constraints.forEach((c: string, i: number) => {
        const row = g.append("g").attr("transform", `translate(0, ${25 + i * 25})`);
        row.append("circle").attr("r", 3).attr("fill", "#10b981").attr("cx", 5).attr("cy", -5);
        row.append("text")
          .attr("x", 15)
          .attr("fill", "#94a3b8")
          .attr("font-size", "12px")
          .text(c);
      });

      const edgeG = g.append("g").attr("transform", `translate(300, 0)`);
      edgeG.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#f59e0b")
        .attr("font-weight", "bold")
        .attr("font-size", "14px")
        .text("CRITICAL EDGE CASES");

      edgeCases.forEach((e: string, i: number) => {
        const row = edgeG.append("g").attr("transform", `translate(0, ${25 + i * 25})`);
        row.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#f59e0b").attr("x", 2).attr("y", -8);
        row.append("text")
          .attr("x", 15)
          .attr("fill", "#94a3b8")
          .attr("font-size", "12px")
          .text(e);
      });

    } else if (type === 'grid') {
        const board = data.board || [];
        const size = 30;
        const g = svg.append("g").attr("transform", "translate(150, 20)");
        
        board.forEach((row: any[], i: number) => {
            row.forEach((cell: any, j: number) => {
                const cellG = g.append("g")
                    .attr("transform", `translate(${j * size}, ${i * size})`);
                
                cellG.append("rect")
                    .attr("width", size)
                    .attr("height", size)
                    .attr("fill", "white")
                    .attr("stroke", "#cbd5e1");
                
                if (cell !== '.') {
                    cellG.append("text")
                        .attr("x", size / 2)
                        .attr("y", size / 2 + 5)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "12px")
                        .text(cell);
                }
            });
        });
    }

  }, [data, type, mode]);

  const renderASCII = () => {
    if (type === 'array' || type === 'set') {
      const items = Array.isArray(data) ? data : (data.items || []);
      const top = items.map((_: any, i: number) => (data.activeIndex === i || data.currentIndex === i) ? "  ↓  " : "     ").join("");
      const mid = items.map((d: any) => `[ ${d} ]`).join(" - ");
      const bot = items.map((_: any, i: number) => `  ${i}  `).join("   ");
      return `${top}\n${mid}\n${bot}${data.complement !== undefined ? `\n\nSearching for complement: ${data.complement}` : ''}`;
    }
    if (type === 'hashmap') {
      const entries = Object.entries(data.map || {});
      if (entries.length === 0) return "Map is empty { }";
      return entries.map(([k, v]) => `${k} => ${v}`).join("\n");
    }
    if (type === 'constraints') {
      const constraints = data.constraints || [];
      const edgeCases = data.edgeCases || [];
      return `CONSTRAINTS:\n${constraints.map((c: string) => `* ${c}`).join("\n")}\n\nEDGE CASES:\n${edgeCases.map((e: string) => `! ${e}`).join("\n")}`;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/5 rounded-xl border border-white/10 overflow-hidden relative">
      <div className="flex-1 flex items-center justify-center p-4">
        <pre className="font-mono text-[10px] text-emerald-400 whitespace-pre leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5 w-full h-full overflow-auto custom-scrollbar">
          {renderASCII()}
        </pre>
      </div>
    </div>
  );
};
