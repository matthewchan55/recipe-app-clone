const mealsEl = document.getElementById('randomMeals');
const favouriteContainer = document.getElementById('fav-meals');
const mealInfo=document.getElementById('meal-info');
const mealpop = document.getElementById('meal-popup');
const popupCLoseBtn = document.getElementById('close-popup');

const favKey =[];

getRandomMeal();
fetchFavMeals();


const searchTerm = document.getElementById('search-term');
const searchBtn  = document.getElementById('search');


//Step 1: generate random meal
// if you like it, the mealId will push to localStorage
async function getRandomMeal(){
    const resp = await fetch(
        "https://www.themealdb.com/api/json/v1/1/random.php"
    );

    const respData = await resp.json();
    const rndMeal = respData.meals[0];  //object -> .meals -> .meals[0]

    console.log(rndMeal);

    addMeal(rndMeal, true);
}


function addMeal(mealData, random = false){
    const meal = document.createElement('div');
    meal.classList.add('meal');

    meal.innerHTML = `
        <div class="meal-header">
            ${random ? 
                `<span class="random">Random Recipe</span>`: ""
            }

            <img class="meal-photo"
                src="${mealData.strMealThumb}" 
                alt="${mealData.strMeal}"
            />
        </div>

        <div class="meal-body">
            <h4>${mealData.strMeal}</h4>
            <button class="fav-btn">
                <i class="fa fa-heart"></i>   
            </button> 
        </div>
    `;


    const btn=meal.querySelector(".meal-body .fav-btn");

    btn.addEventListener("click", ()=> {
        if(btn.classList.contains("active")){
            removeMealsLS(mealData.idMeal);
            btn.classList.remove("active");
        } else{
            addMealsLS(mealData.idMeal);
            btn.classList.add("active");
        }
        fetchFavMeals();
    });

    const mealImg = meal.querySelector(".meal-header .meal-photo");
    mealImg.addEventListener('click', ()=>{
        showMealInfo(mealData);
    });


    mealsEl.appendChild(meal);
}

//Step2: localStorage

function addMealsLS(mealId){
    const mealIds=getMealsLS();

    localStorage.setItem("mealIds", JSON.stringify([...mealIds, mealId]));

}

function removeMealsLS(mealId){
    const mealIds = getMealsLS();

    localStorage.setItem("mealIds", JSON.stringify(mealIds.filter((id) => id !== mealId)));
}


function getMealsLS(){
    const mealIds = JSON.parse(localStorage.getItem("mealIds"));

    return mealIds === null ? []: mealIds;

    //at first: localStorage does not have something call 'mealIds', return an empty array

    //-> created -> setItem (mealId) into mealIds array (thats why we have ...mealIds (=js array))

    //if created, next time will fetch the whole mealIds
}


//Step 3: Favourite category to display the information (photo, name) of the stored mealId

async function fetchFavMeals(){
    //
    favouriteContainer.innerHTML="";

    const mealIds = getMealsLS();

    for(let i =0;i<mealIds.length;i++){
        const mealId = mealIds[i];
        meal = await getMealById(mealId);

        addMealToFav(meal);
    }
}



async function getMealById(id){
    const resp = await fetch("https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + id);

    const respData = await resp.json();
    const meal = respData.meals[0];

    return meal;
}


function addMealToFav(mealData){

    //pass the favourite recipe keyword to array
    const favName = mealData.strMeal;
    
    var keywords = favName.split(' ');
    for (var j = 0; j < keywords.length; j++) {
        favKey.push(keywords[j]);
    }

    const favMeal = document.createElement('li');

    favMeal.innerHTML = `
        <img class="fav-meal-photo"
            src="${mealData.strMealThumb}" 
            alt="${mealData.strMeal}"/>
        <span>${mealData.strMeal}</span>
        <button class="clear"><i class="fas fa-window-close"></i></button>
    `;

    const mealImg = favMeal.querySelector(".fav-meal-photo");
    mealImg.addEventListener('click', ()=>{
        showMealInfo(mealData);
    });

    const cancelbtn = favMeal.querySelector('.clear');
    cancelbtn.addEventListener('click', () => {
        removeMealsLS(mealData.idMeal);
        fetchFavMeals();
    });

    //if a meal is cancelled, remove the id of the meal from localstorage and fetch again

    favouriteContainer.appendChild(favMeal);
}




//Step 4: serach a recipe

searchBtn.addEventListener('click', async ()=>{
    mealsEl.innerHTML="";
    const search = searchTerm.value;
    const meals = await getMealBySearch(search);

    if(meals){
        searchRecipe(meals);
    } else {
        var filtered = [...new Set(favKey)];
        const altKey = getMultipleRandom(filtered, 5);

        mealsEl.innerHTML=`
            <span>Sorry, No recipe about ${search}  is found.
            But you may be interested in...</span>
        `;

        console.log(altKey);

        for(let i =0;i<altKey.length;i++){
            const altMeal = await getMealBySearch(altKey[i]);
            searchRecipe(altMeal);
        }
    }

});

function getMultipleRandom(arr, num) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

function searchRecipe(meals){
    meals.forEach((meal) =>{
        addMeal(meal);
    })
}

async function getMealBySearch(keyword) {
    const resp = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + keyword);

    const respData = await resp.json();
    const meals = respData.meals;

    //e.g. chocolate, 8 results in array is returned
    return meals;

}


//Step 5: Meal popup

//Click the photo with details
function showMealInfo(mealData){

    mealInfo.innerHTML='';
    console.log(mealData);
    //get ingredient and measures
    const steps = [];

    for(let i=1;i<20;i++){
        if(mealData['strIngredient'+i]){
            const stepEl = mealData['strMeasure'+i] == null || mealData['strMeasure'+i].match(/^ *$/) ? mealData['strIngredient'+i]: mealData['strIngredient'+i] + ': ' + mealData['strMeasure'+i];

            steps.push(stepEl);
        } else{
            break;
        }
    }

    const mealEl = document.createElement('div');
    mealEl.innerHTML= `
        <h1>${mealData.strMeal}</h1>
        <img 
            src="${mealData.strMealThumb}" 
            alt="${mealData.strMeal}">
        
        <p>
        ${mealData.strInstructions}
        </p>
        <h3>Ingredients / Measures:</h3>
        <ul>
            ${steps.map((ing => `<li>${ing}</li>`)).join("")}
        </ul>
    `
    //.map -> = forEach: for each ingredient change to ingredient with li
    //.join -> remove the comma between array elements

    mealInfo.appendChild(mealEl);

    //show popup
    mealpop.classList.remove('hidden');
}


//Close the popup container
popupCLoseBtn.addEventListener('click', ()=>{
    mealpop.classList.add('hidden');
})

