	//Variables
	var sessionToken;
	var correctAnswers = 0;
	var incorrectAnswers = 0;	
	var numberOfQuestions = 0;
	var currentQuestion = 0;
	var triviaJSON;
	var questionPending = false;
	var questionTimer;
	var continueTimer;
	
	//doc ready function
	$( document ).ready(function(){
		//Loop from 1-50 and set the options in the select so I don't have to type them
		for(i=1;i<=50;i++){
			var option=$('<option value="'+i+'">'+i+'</option>');
			$('#trivia_amount').append(option);
		}
		//retrive a session token from opentdb
		sessionToken = function(){
			url='https://opentdb.com/api_token.php?command=request';
			$.post(url, function( data ) {
	  			sessionToken=data.token;
	  			$('#startButton').removeClass('btn-disabled');
	  			$('#startButton').addClass('btn-primary');
	  			$('#startButton').text('Start the game!');
	  			$('#startButton').on('click',function(){startGame()});
			});
		}
		//get all possible categories from opentdb
		getCategories = function(){
			$.post('https://opentdb.com/api_category.php',function(data){
				categories = data.trivia_categories;
				$(categories).each(function(){
					$('#trivia_category').append('<option value='+this.id+'>'+this.name+'</option>')
				})
			})
		}
		//get cats
		getCategories();
		//get token
		sessionToken();
		//reset game
		initGame();
	});
	
	//Reset session token for opentdb
	function resetSession(){
		url='https://opentdb.com/api_token.php?command=reset&token='+sessionToken;
		$.post(url, function( data ) {
  			sessionToken=data.token;
		});
	}
	
	//Init game (return to main menu)
	//reset all form variables
	function initGame(){
		$('#title').text('Totally Awesome Trivia');
		clearInterval(questionTimer);
		clearInterval(continueTimer);
		$('#trivia-form-container').removeClass('hidden');
		$('#trivia-content').empty();
		$('#trivia-content').addClass('hidden');
		$('#trivia_amount').val(1);
		$('#trivia_category').val('any');
		$('#trivia_difficulty').val('any');
		$('#trivia_type').val('any');
		$('#start-button').show()
	}
	
	//RESTART GAME
	function startGame(){
		$('#errMsg').addClass('hidden');
		$('#errDiv').addClass('hidden');
		triviaURL = 'https://opentdb.com/api.php?amount='
		//AMOUNT ALWAYS PRESENT
		amount = $('#trivia_amount').val();
		triviaURL+=amount;
		//CATEGORY
		if($('#trivia_category').val()!='any'){
			triviaURL+='&category='+ $('#trivia_category').val();
		}
		//DIFFICULTY
		if($('#trivia_difficulty').val()!='any'){
			triviaURL+='&difficulty='+ $('#trivia_difficulty').val();
		}
		//TYPE
		if($('#trivia_type').val()!='any'){
			triviaURL+='&type='+ $('#trivia_type').val();
		}
		//TOKEN
		triviaURL+='&token='+sessionToken;
		//Get Questions
		getTrivia = function(){
				$.post(triviaURL,function(data){
					if(data.response_code === 0){
						//set question json
						triviaJSON = data.results;
						//reset the timer (mostly for debug purposes)
						clearInterval(questionTimer);
						clearInterval(continueTimer);
						//reset variables 
						currentQuestion = 0;
						correctAnswers=0;
						incorrectAnswers = 0;
						//HIDE TRIVIA FORM
						$('#trivia-form-container').addClass('hidden');
						//HIDE START BUTTON
						$('#start-button').hide();
						//SHOW CONTENT BOX
						$('#trivia-content').removeClass('hidden');
						goToQuestion(0);
					}else{
						//Problem with the response
						if(data.response_code === 1){
							msg=('Sorry, there weren\'t enough questions matching your selections');
							$('#errMsg').html(msg);
							$('#errMsg').removeClass('hidden');
							$('#errDiv').removeClass('hidden');
						}else if(data.response_code === 4){
							//Ran out of questions for this session
							msg=('Sorry, there weren\'t enough questions matching your selections.');
							resetSession();
							$('#errMsg').html(msg);
							$('#errMsg').removeClass('hidden');
							$('#errDiv').removeClass('hidden');
						}
					}
			})
		}
		getTrivia();
	}
	
	
	//go to a given question
	function goToQuestion(questionID){
		clearInterval(continueTimer);
		//Allows answers to be selected
		questionPending = false;
		//clear the trivia content and rebuild
		$('#trivia-content').empty();
		//get question data
		thisQuestion = triviaJSON[questionID];
		//set title
		$('#title').text('Question '+(questionID+1) + ' of ' + triviaJSON.length);
		
		//new trivia div
		triviaDiv = $('<div>');
		//difficulty
		triviaDiv.append('<h5>Difficulty: <span class="difficulty trivia_'+thisQuestion.difficulty+'">'+thisQuestion.difficulty.toUpperCase()+'</span></h5>')
		//category
		triviaDiv.append('<h5>Category: '+ thisQuestion.category+'</h5>');
		//actual question
		triviaDiv.append('<h3>'+ thisQuestion.question+'</h3>');
		
		//account for t/f or multiple choice
		if(thisQuestion.type == 'boolean'){
			//TRUE BUTTON
			newRow = $('<div class="row">');
			newColumn = $('<div class="col-xs-12 text-center">');
			newButton = $('<button class="btn btn-primary option" data-value="True">');
			newButton.html('True');
			newColumn.append(newButton);
			newRow.append(newColumn);
			triviaDiv.append(newRow);
			//FALSE BUTTON
			newRow = $('<div class="row">');
			newColumn = $('<div class="col-xs-12 text-center">');
			newButton = $('<button class="btn btn-primary option" data-value="False">');
			newButton.html('False');
			newColumn.append(newButton);
			newRow.append(newColumn);
			triviaDiv.append(newRow);
		}else{
			//build an answer array form incorrect answers
			answersArray = thisQuestion.incorrect_answers;
			//add the correct answer
			answersArray.push(thisQuestion.correct_answer);
			//mix 'em up			
			shuffledArray = shuffle(answersArray);
			//throw a button up for each answer
			$(answersArray).each(function(){
				newRow = $('<div class="row">');//new row
				newColumn = $('<div class="col-xs-12 text-center">');//new column
				newButton = $('<button class="btn btn-primary option" data-value="'+this+'">');//new button
				newButton.html(this);//button gets the answer
				newColumn.append(newButton);//column gets the button
				newRow.append(newColumn);//row gets the column
				triviaDiv.append(newRow);//content gets the row
			})
		}
		//TIMER
		progressBar = $('<progress value="10" max="10" id="progressBar"></progress>');//progress bar
		newRow = $('<div class="row">');//new row
		newColumn = $('<div class="col-xs-12 text-center">');//new column
		newColumn.append(progressBar);//column gets the progress bar
		newRow.append(newColumn);//row gets the column
		triviaDiv.append(newRow);//content gets the row
		//TIMER TEXT
		timerText = $('<div id="timerText">')//visible countdown
		newRow = $('<div class="row">');//new row
		newColumn = $('<div class="col-xs-12 text-center">');//new column
		newColumn.append(timerText);//column gets the text
		newRow.append(newColumn);//row gets the column
		triviaDiv.append(newRow);//content gets the row. God I'm doing this a lot.

		$('#trivia-content').append(triviaDiv);//big box gets the freshly built trivia div
		
		//reset listeners
		$('.option').on('click',function(){
			checkAnswer(this);//checks answer when an option button is clicked
		});
		//starts the timer
		timeQuestion(10)
	}

function timeQuestion(time){
	$('#timerText').text(time);
	questionTimer = setInterval(function(){
		time = time-1;
		$('#progressBar').val(time);
		$('#timerText').text(time);
		if(time <= 0){
			clearInterval(questionTimer);
			answerIncorrect(1);
		}
	},1000);
}

function timeContinue(time){
	$('#continueTimer').text(time);
	continueTimer = setInterval(function(){
		time = time-1;
		$('#continueTimer').text(time);
		if(time <= 0){
			clearInterval(continueTimer);
			goToQuestion(currentQuestion+1);
			currentQuestion++;
		}
	},1000);
	
}


//array suffler so the correct answer isn't always the same position
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex){
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

//check if answer is correct for button click
function checkAnswer(button){
	//clear question timer
	clearInterval(questionTimer);
	clearInterval(continueTimer);

	//check to see if an answer is selected and we're waiting for them to click continue - i.e. no double clciks
	if(questionPending === false){
		$('#timerText').remove();
		$('#progressBar').remove();	
		answer = $(button).data('value');
		//verify correct answer
		if(answer == triviaJSON[currentQuestion].correct_answer){
			answerCorrect(button);			
		}else{
			answerIncorrect(0,button)		
		}
	}
	
}

function answerCorrect(button){
	questionPending = true;
	correctAnswers++;
	//highlight correct answer
	$(button).removeClass('btn-primary');
	$(button).addClass('btn-success');
	//message
	msg='Correct';
	newRow = $('<div class="row">');
	newColumn = $('<div class="col-xs-8 col-xs-offset-2 text-center">');
	newMessage = $('<div class="alert-success text-center"><b>'+msg+'</b></div>');
	newColumn.append(newMessage);
	newRow.append(newColumn);
	$('#trivia-content').append(newRow);
	//buttons
	doButtons();
}

function answerIncorrect(isTimer,button){
	questionPending = true;
	var msg = '';
	//timer ends question
	if(isTimer === 1){
		msg = 'Time\'s Up!<br>'		
	}else{
	//wrong answer
		incorrectAnswers++;
		$(button).removeClass('btn-primary');
		$(button).addClass('btn-danger');
		msg = 'Incorrect!'	
	}
	//highlight correct answer
	$('.option').each(function(){
		if($(this).data('value') == triviaJSON[currentQuestion].correct_answer){
			$(this).removeClass('btn-primary');
			$(this).addClass('btn-success');
		}
	});
	//message
	newRow = $('<div class="row">');
	newColumn = $('<div class="col-xs-8 col-xs-offset-2 text-center">');
	newMessage = $('<div class="alert-danger text-center"><b>'+msg+'</b></div>');
	newColumn.append(newMessage);
	newRow.append(newColumn);
	$('#trivia-content').append(newRow);
	//buttons
	doButtons();
}

function doButtons(){
	//GAME OVER
	//correct pluralization
	if(currentQuestion + 1 == triviaJSON.length){
		var plural_q;
		if(triviaJSON.length > 1){
			plural_q = 'questions';
		}else{
			plural_q = 'question';
		}
		var plural_a;
		if(correctAnswers > 1 || correctAnswers == 0){
			plural_a = 'answers';
		}else{
			plural_a = 'answer';
		}
		//Game over message, play again button, main menu button
		
		score=$('<b>Game Over! You got '+ correctAnswers+' correct '+plural_a + ' out of ' + triviaJSON.length + ' ' + plural_q + '.</b>');
		newButton = $('<button class="btn btn-primary continue-btn">');
		newButton.html('Play Again <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>');
		newButton.on('click',function(){startGame()});
		newRow = $('<div class="row">');
		newColumn = $('<div class="col-xs-10 col-xs-offset-1 text-center alert-info infobox">');
		newColumn.append(score);
		newColumn.append(newButton);

		newButton = $('<button class="btn btn-primary continue-btn">');
		newButton.html('Main Menu <span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>');
		newButton.on('click',function(){initGame()});
		newColumn.append(newButton);

		newRow.append(newColumn);
		$('#trivia-content').append(newRow);				
	}else{
		timeContinue(3);
		//Next question button
		newButton = $('<button class="btn btn-primary continue-btn">');
		newButton.html('Continue (<span id="continueTimer">3</span>) <span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
		newButton.on('click',function(){goToQuestion(currentQuestion+1);currentQuestion++;});
		newRow = $('<div class="row">');
		newColumn = $('<div class="col-xs-8 col-xs-offset-2 text-center">');
		newColumn.append(newButton);
		newRow.append(newColumn);
		$('#trivia-content').append(newRow);
	}
}