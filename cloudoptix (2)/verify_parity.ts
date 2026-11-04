import fs from 'fs';
import path from 'path';
import { defaultGraphSageModel, mathOps } from './src/research/gnn/graphSageModel';
import { buildMultiCloudGraph } from './src/research/graph/graphBuilder';
import { INITIAL_CLOUDS, INITIAL_WORKLOADS } from './src/data/initialData';
import { generateExpandedWorkloads } from './src/research/exportDataset';

async function runParityCheck() {
  console.log('='.repeat(80));
  console.log('PYTHON-TYPESCRIPT NUMERICAL PARITY VERIFICATION');
  console.log('='.repeat(80));

  const datasetPath = path.resolve(process.cwd(), 'gnn_research/data/dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  const parityInputsPath = path.resolve(process.cwd(), 'gnn_research/data/test_parity_inputs.json');
  const parityData = JSON.parse(fs.readFileSync(parityInputsPath, 'utf8'));

  // Load weights from trainedWeights.json
  const weightsPath = path.resolve(process.cwd(), 'src/research/gnn/trainedWeights.json');
  const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));

  console.log(`[TS Model] Loaded weights version: ${weights.version}`);
  console.log(`[TS Model] W_out length: ${weights.W_out?.length}, b_out: ${weights.b_out}`);

  // Test 1: Link scoring readout parity for identical embeddings & interaction features
  // PyTorch link MLP vs TS scoreCandidate
  console.log('\n--- TEST A: Link MLP Readout Mathematical Parity ---');
  let maxLogitDiff = 0;
  let maxProbDiff = 0;
  let totalCandidatesChecked = 0;

  // Let's test TS link scoring on the raw node features from dataset.json
  const nodes = dataset.graph.nodes;
  const cloudIds = ['aws', 'azure', 'gcp'];

  // Check how TS forwardEmbeddings behaves vs Python encode(X, A_norm)
  // Build graph in TS
  const workloads = generateExpandedWorkloads(INITIAL_WORKLOADS, 140, 101);
  const clouds = INITIAL_CLOUDS;
  const graph = buildMultiCloudGraph(workloads, clouds, {
    includeDependencies: true,
    includeInterconnects: true,
  });

  const tsEmbeddings = defaultGraphSageModel.forwardEmbeddings(graph);

  console.log(`[TS Embeddings] Computed embeddings for ${Object.keys(tsEmbeddings).length} nodes.`);
  const sampleWlNodeId = `wl_${workloads[0].id}`;
  const sampleCloudNodeId = `cloud_aws`;
  console.log(`Sample TS wl embedding (first 4 dims):`, tsEmbeddings[sampleWlNodeId]?.slice(0, 4));
  console.log(`Sample TS cloud embedding (first 4 dims):`, tsEmbeddings[sampleCloudNodeId]?.slice(0, 4));

  // Compare predictions on the 21 test workloads
  console.log('\n--- TEST B: End-to-End Placement Decisions on 21 Held-Out Test Workloads ---');
  let choiceMatches = 0;
  let rankingMatches = 0;
  let totalTestWls = parityData.test_workloads.length;

  console.log(`${'Workload'.padEnd(10)} | ${'Py Choice'.padEnd(10)} | ${'TS Choice'.padEnd(10)} | ${'Match?'.padEnd(8)} | ${'Py Probs (AWS/AZ/GCP)'.padEnd(26)} | ${'TS Probs (AWS/AZ/GCP)'.padEnd(26)}`);
  console.log('-'.repeat(105));

  for (const tw of parityData.test_workloads) {
    const wId = tw.workloadId;
    const wNodeId = `wl_${wId}`;
    const wEmbed = tsEmbeddings[wNodeId];

    const tsProbs: number[] = [];
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const cid = cloudIds[cIdx];
      const cNodeId = `cloud_${cid}`;
      const cEmbed = tsEmbeddings[cNodeId];
      const interaction = tw.candidates[cIdx].interaction;

      const prob = defaultGraphSageModel.scoreCandidate(wEmbed, cEmbed, interaction);
      tsProbs.push(prob);

      const inputVec = [...wEmbed, ...cEmbed, ...interaction];
      const hidden = mathOps.vecAdd(mathOps.matVec(defaultGraphSageModel.W_link, inputVec), defaultGraphSageModel.b_link);
      const activatedHidden = hidden.map(mathOps.leakyRelu);
      const tsLogit = mathOps.dot(defaultGraphSageModel.W_out, activatedHidden) + defaultGraphSageModel.b_out;

      const pyLogit = tw.candidates[cIdx].python_logit;
      const logitDiff = Math.abs(tsLogit - pyLogit);
      if (logitDiff > maxLogitDiff) maxLogitDiff = logitDiff;

      const pyProb = tw.candidates[cIdx].python_prob;
      const probDiff = Math.abs(prob - pyProb);
      if (probDiff > maxProbDiff) maxProbDiff = probDiff;
      totalCandidatesChecked++;
    }

    // TS unmasked selection
    const maxTsProb = Math.max(...tsProbs);
    const tsChoiceIdx = tsProbs.indexOf(maxTsProb);
    const tsChoice = cloudIds[tsChoiceIdx];
    const pyChoice = tw.python_unmasked_choice;
    const isMatch = tsChoice === pyChoice;
    if (isMatch) choiceMatches++;

    // Full ranking order comparison (e.g. sort 0, 1, 2 by descending probability)
    const pyRanking = tw.candidates
      .map((c: any, idx: number) => ({ idx, prob: c.python_prob }))
      .sort((a: any, b: any) => b.prob - a.prob)
      .map((item: any) => item.idx);
    const tsRanking = tsProbs
      .map((prob, idx) => ({ idx, prob }))
      .sort((a, b) => b.prob - a.prob)
      .map((item) => item.idx);
    const isRankMatch = pyRanking.every((val: number, i: number) => val === tsRanking[i]);
    if (isRankMatch) rankingMatches++;

    const pyProbsStr = tw.candidates.map((c: any) => c.python_prob.toFixed(3)).join(', ');
    const tsProbsStr = tsProbs.map((p) => p.toFixed(3)).join(', ');

    const matchStr = isMatch ? 'MATCH' : 'DIFF';
    console.log(`${wId.padEnd(10)} | ${pyChoice.padEnd(10)} | ${tsChoice.padEnd(10)} | ${matchStr.padEnd(8)} | [${pyProbsStr}] | [${tsProbsStr}]`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('PARITY AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Top-1 Placement Choice Match:   ${choiceMatches}/${totalTestWls} (${((choiceMatches / totalTestWls) * 100).toFixed(1)}%)`);
  console.log(`Full Ranking Order Matches:     ${rankingMatches}/${totalTestWls} (${((rankingMatches / totalTestWls) * 100).toFixed(1)}%)`);
  console.log(`Total Candidates Evaluated:     ${totalCandidatesChecked}`);
  console.log(`Maximum Absolute Logit Delta:   ${maxLogitDiff.toExponential(4)}`);
  console.log(`Maximum Probability Delta:      ${maxProbDiff.toExponential(4)}`);
  console.log('='.repeat(80));
}

runParityCheck().catch(console.error);
