const Agency = require("@adasuite/agentgpt");
const fs = require("fs");

module.export = async function init({ OpenAI_Key, task, procedure_output }) {
  const Recruit = Agency({
    API_KEY: OpenAI_Key,
  });

  const AgentRecruit = Recruit.new_agent({
    identity: "",
    analysis:
      "Based on the task, create set of LLM agents that connect to other LLM agents in order to complete a task. Make each agent focus on a specific thing.",
    output: JSON.stringify([
      {
        position: "< starting_agent | ending_agent >",
        agent_name: "<agent name>",
        analysis: "<analysis agent will do based on a input data",
        output: "JSON representation of its output data",
        connects_to: "<agent_name that it sends it output to",
      },
      "...",
    ]),
  });
  let agent_list = await AgentRecruit.analyze(
    JSON.stringify({
      task: task,
    })
  );

  let agents = {};
  agent_list.forEach((agent) => {
    agents[agent.agent_name] = agent;
  });
  fs.writeFileSync(procedure_output, JSON.stringify(agents));
  console.log(agents);
  return start(agents);
};

function start(agents_list) {
  let agents = {};
  let initial_agent = "";
  for (const agent of Object.values(agents_list)) {
    console.log("building...", agent);
    if (agent.position === "starting_agent") initial_agent = agent.agent_name;
    agents[agent.agent_name] = Recruit.new_agent(
      {
        identity: "",
        analysis: agent.analysis,
        output: agent.output,
      },
      { max_tokens: 500 }
    );
  }
  return async function (prompt) {
    let current_agent = initial_agent;
    let current_output = prompt;
    console.log(agents_list[current_agent]);
    while (agents_list[current_agent]) {
      current_output = await agents[current_agent].analyze(prompt);
      console.log(current_output);
      current_agent = agents_list[current_agent].connects_to;
    }
    return current_output;
  };
}
