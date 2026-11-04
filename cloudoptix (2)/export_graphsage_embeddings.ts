import fs from 'fs';
import path from 'path';
import { INITIAL_CLOUDS, INITIAL_WORKLOADS } from './src/data/initialData';
import { generateExpandedWorkloads } from './src/research/exportDataset';
import { buildMultiCloudGraph } from './src/research/graph/graphBuilder';
import { defaultGraphSageModel } from './src/research/gnn/graphSageModel';

function exportNodeEmbeddings() {
  console.log('Generating genuine GraphSAGE node embeddings...');
  const workloads = generateExpandedWorkloads(INITIAL_WORKLOADS, 140, 101);
  const clouds = INITIAL_CLOUDS;

  const graph = buildMultiCloudGraph(workloads, clouds, {
    includeDependencies: true,
    includeInterconnects: true,
  });

  const embeddings = defaultGraphSageModel.forwardEmbeddings(graph);

  const outDir = path.resolve(process.cwd(), 'gnn_research/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'graphsage_node_embeddings.json');
  fs.writeFileSync(outPath, JSON.stringify(embeddings, null, 2), 'utf8');

  console.log(`Saved ${Object.keys(embeddings).length} GraphSAGE node embeddings to ${outPath}`);
  console.log('Cloud AWS embedding (first 4):', embeddings['cloud_aws']?.slice(0, 4));
  console.log('Cloud Azure embedding (first 4):', embeddings['cloud_azure']?.slice(0, 4));
  console.log('Cloud GCP embedding (first 4):', embeddings['cloud_gcp']?.slice(0, 4));
  console.log('WL-100 embedding (first 4):', embeddings['wl_WL-100']?.slice(0, 4));
}

exportNodeEmbeddings();
