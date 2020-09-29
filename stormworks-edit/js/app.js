const mission_url = "./mission.template";
const task_template =
    {
        step: 1,
        name: "",
        type: "goto_zone",
        base_reward: 0,
        base_research:0,
        desc: "",
        timelimit: 60,
        zone: "",
        zone_size: 100,
        deliver_name: "",
        deliver_zone: "",
        reward_per_survivor:0,
        research_per_survivor:0,
        rescue_name:"",
        no_bleed: false,
        ignore_vehicle: false,
    };

const vm = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue.js!',
        missions:[
            {
                id: 'test_mission',
                name: "Test mission",
                location: "",
                reward: 0,
                research: 0,
                probability: 0.5,
                task: [
                ]
            },
        ],
        script: "",
        script_template: "",
        mission_template: "",
        task_template: ""
    },
    mounted(){
        this.addTask(0);
        axios.get(mission_url)
            .then(response => (this.mission_template = response.data))
            .catch(response => console.log(response))
    },
    computed: {
        script_out:function() {

            let mission_text = "";
            this.missions.forEach((mission, index) => {
                let task = this.renderTask(mission.task, index);
                let mapObj = {
                    mission_id: mission.id,
                    name: mission.name,
                    location: mission.location,
                    reward: mission.reward,
                    research: mission.research,
                    probability: mission.probability,
                    tasks: task
                };
                mission_text = mission_text + replaceScriptTag(this.mission_template, mapObj);
            });
            //return "local mm_missions = {\n" + mission_text + "\n}";
            return mission_text;
        },
        grouped_tasks: function () {
            let step_task = [];
            this.missions.forEach((mission, index) => {
                let max_step = maxStep(mission);
                step_task[index] = [];

                for (let i = 0; i <= max_step; i++) {
                    step_task[index][i] = mission.task.filter(v => v.step === i);
                }
            });
            return step_task;
        }
    },
    methods: {
        matchValue: function (key, array) {
            return array.some(v => v === key);
        },
        addTask: function(mission_index){
            let newTask = _.cloneDeep(task_template); // copy value
            newTask.step = maxStep(this.missions[mission_index]);
            this.missions[mission_index].task.push(newTask);
        },
        removeTask: function(mission_index, task_index){
          if (this.missions[mission_index].task.length > 1){
              this.missions[mission_index].task.splice(task_index, 1);
          }
        },
        moveTask: function(mission, task, value){
            // check
            let max_step = maxStep(mission);

            if ((task.step === 0 && value < 0) || // step1 && -しようとしている
                (mission.task.filter(e => e.step === task.step).length <= 1 && (value > 0 || task.step !== max_step))  // 同じstepのタスクが一件しかない && (+しようとしている || タスクの最大値ではない)
                //(miss)
                ){
                return;
            }
            task.step += value;
        },
        renderTask: function (task_object, index) {
            let tasks = [];
            let sorted_task = task_object.sort((a, b) => a.step - b.step);

            sorted_task.forEach((task, task_index) => {
                let text = '            ' +  '{\n';
                Object.keys(task).forEach((key) => {
                    let value = task[key];
                    if (key === "timelimit"){
                        value = value + "*3600";
                    }
                    let valid_key = false;
                    // Check default keys
                    if (/^(step|name|type|desc|timelimit|base_reward|base_research)$/.test(key)){
                        valid_key = true
                    }
                    // Check zone specified key
                    switch (task.type) {
                        case "goto_zone":
                            if (/^(zone|zone_size)$/.test(key)){ valid_key = true; }
                            break;
                        case "rescue":
                            if ((key === "rescue_name" && value) || (key === "no_bleed" && value)
                             || (key === "reward_per_survivor" && value) || (key === "research_per_survivor" && value)){
                                valid_key = true;
                            }
                            break;
                        case "extinguish":
                            if ((key === "tag" && value) || (key === "ignore_vehicle" && value)){
                                valid_key = true;
                            }
                            break;
                        case "deliver_survivor":
                            if ((key === "reward_per_survivor" && value) || (key === "research_per_survivor" && value)){
                                valid_key = true;
                            }
                        case "deliver_vehicle":
                        case "deliver_object":
                            if (/^(deliver_zone)$/.test(key)){ valid_key = true; }
                            if (key === "deliver_name" && value){
                                valid_key = true;
                            }
                            break;
                        default:
                            Console.log("warning: unknown task");
                    }
                    // Skip if invalid key
                    if (!valid_key) return;

                    // TODO: refactor this
                    if (Number.isFinite(task[key])) {
                        text = text + '            ' + key + ' = ' + value + ',\n';
                    } else if(typeof(task[key]) === 'boolean') {
                        text = text + '            ' + key + ' = ' + value + ',\n';
                    } else if(typeof(task[key]) === 'string') {
                        value = value.replace(/\n/g, "\\n");
                        text = text + '            ' + key + ' = "' + value + '",\n';
                    }
                });
                text = text + '            ' +  '},';
                tasks.push(text);
            });
            return tasks.join("\n") + "\n";
        }
    }
 });

function replaceScriptTag(template, mapObj){
    let tags = Object.keys(mapObj).map(v => "<" + v + ">");
    let pattern = new RegExp(tags.join("|"),"gi");
    return template.replace(pattern, function(matched){
        return mapObj[matched.substring(1, matched.length-1)];
    });
}

function maxStep(mission){
    let max_step = 0;
    max_step = mission.task.reduce(function(a, b) {
        return Math.max(a, b.step);
    },0);
    console.log(max_step);
    return max_step;
}

getVueObject = obj => {
    return JSON.parse(JSON.stringify( obj ));
};

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})