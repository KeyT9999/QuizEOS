import { Quiz, QuizQuestion, QuizOption, QuizAttempt } from '../types';
import * as api from './api';

const STORAGE_KEY = 'examflow_quizzes';
const ATTEMPTS_KEY = 'examflow_attempts';
const GEMINI_API_KEY_STORAGE = 'examflow_gemini_api_key';
// Default Gemini API key (used when user hasn't provided one)
const DEFAULT_GEMINI_API_KEY = 'AIzaSyCc-9vLFBtmk64g_avygvV-1kaEAHAjRRA';
const SHARED_QUIZZES_KEY = 'examflow_shared_quizzes'; // Store quiz IDs that were shared

// Seed data to help user see UI immediately
const DEMO_QUIZ: Quiz = {
  id: 'fe-fall-25',
  userId: 'demo', // Demo quiz for all users
  title: 'FE FALL 25',
  description: 'Software Testing Foundation Practice Questions',
  createdAt: Date.now(),
  questions: [
    {
      id: 'q1',
      order: 1,
      prompt: 'Which is not the testing objectives',
      correctOptionId: 'q1-d',
      options: [
        { id: 'q1-a', label: 'A', text: 'Finding defects' },
        { id: 'q1-b', label: 'B', text: 'Gaining confidence about the level of quality and providing information' },
        { id: 'q1-c', label: 'C', text: 'Preventing defects' },
        { id: 'q1-d', label: 'D', text: 'Debugging defects' },
      ]
    },
    {
      id: 'q2',
      order: 2,
      prompt: 'A person who documents all the issues, problems and open points that were identified during a formal review',
      correctOptionId: 'q2-b',
      options: [
        { id: 'q2-a', label: 'A', text: 'Moderator' },
        { id: 'q2-b', label: 'B', text: 'Scribe' },
        { id: 'q2-c', label: 'C', text: 'Author' },
        { id: 'q2-d', label: 'D', text: 'Manager' },
      ]
    },
    {
      id: 'q3',
      order: 3,
      prompt: 'Statement Coverage will not check for the following.',
      correctOptionId: 'q3-a',
      options: [
        { id: 'q3-a', label: 'A', text: 'Missing Statements' },
        { id: 'q3-b', label: 'B', text: 'Unused Branches' },
        { id: 'q3-c', label: 'C', text: 'Dead Code' },
        { id: 'q3-d', label: 'D', text: 'Unused Statement' },
      ]
    },
    {
      id: 'q4',
      order: 4,
      prompt: 'A project that is in the implementation phase is six weeks behind schedule. The delivery date for the product is four months away. The project is not allowed to slip the delivery date or compromise on the quality standards established for his product. Which of the following actions would bring this project back on schedule?',
      correctOptionId: 'q4-a',
      options: [
        { id: 'q4-a', label: 'A', text: 'Eliminate some of the requirements that have not yet been implemented.' },
        { id: 'q4-b', label: 'B', text: 'Add more engineers to the project to make up for lost work.' },
        { id: 'q4-c', label: 'C', text: 'Ask the current developers to work overtime until the lost work is recovered.' },
        { id: 'q4-d', label: 'D', text: 'Hire more software quality assurance personnel.' },
      ]
    },
    {
      id: 'q5',
      order: 5,
      prompt: 'Which of the following is not a static testing technique?',
      correctOptionId: 'q5-a',
      options: [
        { id: 'q5-a', label: 'A', text: 'Error guessing' },
        { id: 'q5-b', label: 'B', text: 'Walkthrough' },
        { id: 'q5-c', label: 'C', text: 'Data flow analysis' },
        { id: 'q5-d', label: 'D', text: 'Inspections' },
      ]
    },
    {
      id: 'q6',
      order: 6,
      prompt: 'Testware (test cases, test dataset)',
      correctOptionId: 'q6-a',
      options: [
        { id: 'q6-a', label: 'A', text: 'Needs configuration management just like requirements, design and code' },
        { id: 'q6-b', label: 'B', text: 'Should be newly constructed for each new version of the software' },
        { id: 'q6-c', label: 'C', text: 'Is needed only until the software is released into production or use' },
        { id: 'q6-d', label: 'D', text: 'Does not need to be documented and commented, as it does not form part of the released software system' },
      ]
    },
    {
      id: 'q7',
      order: 7,
      prompt: 'Minimum Test Required for Statement Coverage:\nDisc = 0\nOrder-qty = 0\nRead Order-qty\nIf Order-qty >=20 then\n  Disc = 0.05\n  If Order-qty >=100 then\n    Disc = 0.1\n  End if\nEnd if',
      correctOptionId: 'q7-b',
      options: [
        { id: 'q7-a', label: 'A', text: 'Statement coverage is 4' },
        { id: 'q7-b', label: 'B', text: 'Statement coverage is 1' },
        { id: 'q7-c', label: 'C', text: 'Statement coverage is 3' },
        { id: 'q7-d', label: 'D', text: 'Statement Coverage is 2' },
      ]
    },
    {
      id: 'q8',
      order: 8,
      prompt: 'Which of the following is NOT a characteristic of User Acceptance Testing?',
      correctOptionId: 'q8-a',
      options: [
        { id: 'q8-a', label: 'A', text: 'Use of automated test execution tools' },
        { id: 'q8-b', label: 'B', text: 'Testing performed by users' },
        { id: 'q8-c', label: 'C', text: 'Testing against acceptance test criteria' },
        { id: 'q8-d', label: 'D', text: 'Integration of system with user documentation' },
      ]
    },
    {
      id: 'q9',
      order: 9,
      prompt: 'A typical commercial test execution tool would be able to perform all of the following EXCEPT:',
      correctOptionId: 'q9-a',
      options: [
        { id: 'q9-a', label: 'A', text: 'Generating expected outputs' },
        { id: 'q9-b', label: 'B', text: 'Replaying inputs according to a programmed script' },
        { id: 'q9-c', label: 'C', text: 'Comparison of expected outcomes with actual outcomes' },
        { id: 'q9-d', label: 'D', text: 'Recording test inputs' },
      ]
    },
    {
      id: 'q10',
      order: 10,
      prompt: 'Which of the following helps in monitoring the Test Progress:\ni. Percentage of Test Case Execution\nii. Percentage of work done in test environment preparation.\niii. Defect Information e.g. defect density, defects found and fixed\niv. The size of the testing Team and skills of the engineers',
      correctOptionId: 'q10-b',
      options: [
        { id: 'q10-a', label: 'A', text: 'iv is correct and i,ii,iii are incorrect' },
        { id: 'q10-b', label: 'B', text: 'i,ii,iii are correct and iv is incorrect' },
        { id: 'q10-c', label: 'C', text: 'i,ii are correct and iii,iv are incorrect' },
        { id: 'q10-d', label: 'D', text: 'i,iv are correct and ii, iii are incorrect' },
      ]
    },
    {
      id: 'q11',
      order: 11,
      prompt: 'The goal of a software tester is to find bugs, find them as early as possible and make sure they get fixed.',
      correctOptionId: 'q11-a',
      options: [
        { id: 'q11-a', label: 'A', text: 'True' },
        { id: 'q11-b', label: 'B', text: 'False' },
        { id: 'q11-c', label: 'C', text: '-' },
        { id: 'q11-d', label: 'D', text: '-' },
      ]
    },
    {
      id: 'q12',
      order: 12,
      prompt: 'A field failure occurs when multiple users access a system. Which of the following is true?',
      correctOptionId: 'q12-c',
      options: [
        { id: 'q12-a', label: 'A', text: 'This is an acceptable risk of a multi-user system.' },
        { id: 'q12-b', label: 'B', text: 'Insufficient functional testing has been performed' },
        { id: 'q12-c', label: 'C', text: 'This indicates an important non-functional requirement was not specified and tested.' },
        { id: 'q12-d', label: 'D', text: 'It is not possible to test against such events prior to release.' },
      ]
    },
    {
      id: 'q13',
      order: 13,
      prompt: 'You have designed test cases to provide 100% statement and 100% decision coverage for the following fragment of code.\nif width > length then\n  biggest_dimension = width\nelse\n  biggest_dimension = length\nend_if\nThe following has been added to the bottom of the code fragment above.\nprint "Biggest dimension is " & biggest_dimension\nprint "Width: " & width\nprint "Length: " & length\nHow many more test cases are required?',
      correctOptionId: 'q13-c',
      options: [
        { id: 'q13-a', label: 'A', text: 'One more test case will be required for 100 % decision coverage.' },
        { id: 'q13-b', label: 'B', text: 'Two more test cases will be required for 100 % statement coverage, one of which will be used to provide 100% decision coverage.' },
        { id: 'q13-c', label: 'C', text: 'None, existing test cases can be used.' },
        { id: 'q13-d', label: 'D', text: 'One more test case will be required for 100" statement coverage.' },
      ]
    },
    {
      id: 'q14',
      order: 14,
      prompt: 'Which of the following is a benefit of test independence?',
      correctOptionId: 'q14-c',
      options: [
        { id: 'q14-a', label: 'A', text: 'It does not require familiarity with the code.' },
        { id: 'q14-b', label: 'B', text: 'It is cheaper than using developers to test their own code.' },
        { id: 'q14-c', label: 'C', text: 'It avoids author bias in defining effective tests.' },
        { id: 'q14-d', label: 'D', text: 'Testers are better at finding defects than developers.' },
      ]
    },
    {
      id: 'q15',
      order: 15,
      prompt: 'Which of the following is true about Formal Review or Inspection:\ni) Led by Trained Moderator (not the author).\nii) No Pre Meeting Preparations\niii) Formal Follow up process.\niv) Main Objective is to find defects',
      correctOptionId: 'q15-b',
      options: [
        { id: 'q15-a', label: 'A', text: 'ii is true and i,iii,iv are false' },
        { id: 'q15-b', label: 'B', text: 'i,iii,iv are true and ii is false' },
        { id: 'q15-c', label: 'C', text: 'i,iii,iv are false and ii is true' },
        { id: 'q15-d', label: 'D', text: 'iii is true and I,ii,iv are false' },
      ]
    },
    {
      id: 'q16',
      order: 16,
      prompt: 'Which of the following is least important in test management?',
      correctOptionId: 'q16-d',
      options: [
        { id: 'q16-a', label: 'A', text: 'Estimating test duration.' },
        { id: 'q16-b', label: 'B', text: 'Incident Management' },
        { id: 'q16-c', label: 'C', text: 'Configuration Management.' },
        { id: 'q16-d', label: 'D', text: 'De-bugging.' },
      ]
    },
    {
      id: 'q17',
      order: 17,
      prompt: 'Defects are recorded into three major purposes. They are:\n1.To correct the defect\n2.To report status of the application\n3.To improve the software development process',
      correctOptionId: 'q17-a',
      options: [
        { id: 'q17-a', label: 'A', text: 'True' },
        { id: 'q17-b', label: 'B', text: 'False' },
        { id: 'q17-c', label: 'C', text: '-' },
        { id: 'q17-d', label: 'D', text: '-' },
      ]
    },
    {
      id: 'q18',
      order: 18,
      prompt: 'When what is visible to end-users is a deviation from the specific or expected behavior, this is called:',
      correctOptionId: 'q18-c',
      options: [
        { id: 'q18-a', label: 'A', text: 'An error' },
        { id: 'q18-b', label: 'B', text: 'A fault' },
        { id: 'q18-c', label: 'C', text: 'A failure' },
        { id: 'q18-d', label: 'D', text: 'A defect' },
      ]
    },
    {
      id: 'q19',
      order: 19,
      prompt: 'A thermometer measures temperature in whole degrees only. If the temperature falls below 18 degrees, the heating is switched off. It is switched on again when the temperature reaches 21 degrees. What are the best values in degrees to cover all equivalence partitions?',
      correctOptionId: 'q19-a',
      options: [
        { id: 'q19-a', label: 'A', text: '15, 19 and 25.' },
        { id: 'q19-b', label: 'B', text: '17, 18 and 19.' },
        { id: 'q19-c', label: 'C', text: '18, 20 and 22.' },
        { id: 'q19-d', label: 'D', text: '16, 26 and 32.' },
      ]
    },
    {
      id: 'q20',
      order: 20,
      prompt: 'Repeated Testing of an already tested program, after modification, to discover any defects introduced or uncovered as a result of the changes in the software being tested or in another related or unrelated software component:',
      correctOptionId: 'q20-c',
      options: [
        { id: 'q20-a', label: 'A', text: 'Re Testing' },
        { id: 'q20-b', label: 'B', text: 'Confirmation Testing' },
        { id: 'q20-c', label: 'C', text: 'Regression Testing' },
        { id: 'q20-d', label: 'D', text: 'Negative Testing' },
      ]
    },
    {
      id: 'q21',
      order: 21,
      prompt: 'Which of the following is a part of Test Closure Activities?\ni. Checking which planned deliverables have been delivered\nii. Defect report analysis.\niii. Finalizing and archiving testware.\niv. Analyzing lessons',
      correctOptionId: 'q21-d',
      options: [
        { id: 'q21-a', label: 'A', text: 'i , ii , iv are true and iii is false' },
        { id: 'q21-b', label: 'B', text: 'i , ii , iii are true and iv is false' },
        { id: 'q21-c', label: 'C', text: 'i , iii , iv are true and ii is false' },
        { id: 'q21-d', label: 'D', text: 'All of them are true' },
      ]
    },
    {
      id: 'q22',
      order: 22,
      prompt: 'Contract and regulation testing is a part of',
      correctOptionId: 'q22-b',
      options: [
        { id: 'q22-a', label: 'A', text: 'System testing' },
        { id: 'q22-b', label: 'B', text: 'Acceptance testing' },
        { id: 'q22-c', label: 'C', text: 'Integration testing' },
        { id: 'q22-d', label: 'D', text: 'Smoke testing' },
      ]
    },
    {
      id: 'q23',
      order: 23,
      prompt: 'Match every stage of the software Development Life cycle with the Testing Life cycle:\ni. Hi-level design\nii. Code\niii. Low-level design\niv. Business requirements\na. Unit tests\nb. Acceptance tests\nc. System tests\nd. Integration tests',
      correctOptionId: 'q23-d',
      options: [
        { id: 'q23-a', label: 'A', text: 'i-d , ii-a , iii-c , iv-b' },
        { id: 'q23-b', label: 'B', text: 'i-c , ii-d , iii-a , iv-b' },
        { id: 'q23-c', label: 'C', text: 'i-b , ii-a , iii-d , iv-c' },
        { id: 'q23-d', label: 'D', text: 'i-c , ii-a , iii-d , iv-b' },
      ]
    },
    {
      id: 'q24',
      order: 24,
      prompt: 'Designing the test environment set-up and identifying any required infrastructure and tools are a part of which phase',
      correctOptionId: 'q24-b',
      options: [
        { id: 'q24-a', label: 'A', text: 'Test Implementation and execution' },
        { id: 'q24-b', label: 'B', text: 'Test Analysis and Design' },
        { id: 'q24-c', label: 'C', text: 'Evaluating the Exit Criteria and reporting' },
        { id: 'q24-d', label: 'D', text: 'Test Closure Activities' },
      ]
    },
    {
      id: 'q25',
      order: 25,
      prompt: 'One of the fields on a form contains a text box, which accepts alphabets in lower or upper case. Identify the invalid Equivalence class value.',
      correctOptionId: 'q25-d',
      options: [
        { id: 'q25-a', label: 'A', text: 'CLASS' },
        { id: 'q25-b', label: 'B', text: 'cLASS' },
        { id: 'q25-c', label: 'C', text: 'CLass' },
        { id: 'q25-d', label: 'D', text: 'CLa01ss' },
      ]
    },
    {
      id: 'q26',
      order: 26,
      prompt: 'Measurement dysfunction is a problem because:',
      correctOptionId: 'q26-a',
      options: [
        { id: 'q26-a', label: 'A', text: 'Even though the numbers you look at appear better, to achieve these numbers, people are doing other aspects of their work much less well.' },
        { id: 'q26-b', label: 'B', text: 'We don\'t know how to measure a variable and so we don\'t know how to interpret the result.' },
        { id: 'q26-c', label: 'C', text: 'You are measuring the wrong thing and thus reaching the wrong conclusions.' },
        { id: 'q26-d', label: 'D', text: 'All of the others' },
      ]
    },
    {
      id: 'q27',
      order: 27,
      prompt: 'Which is not true-The black box tester',
      correctOptionId: 'q27-b',
      options: [
        { id: 'q27-a', label: 'A', text: 'Should be able to understand a functional specification or requirements document' },
        { id: 'q27-b', label: 'B', text: 'Should be able to understand the source code.' },
        { id: 'q27-c', label: 'C', text: 'Is highly motivated to find faults' },
        { id: 'q27-d', label: 'D', text: 'Is creative to find the system\'s weaknesses' },
      ]
    },
    {
      id: 'q28',
      order: 28,
      prompt: 'Which of the following is TRUE?',
      correctOptionId: 'q28-a',
      options: [
        { id: 'q28-a', label: 'A', text: 'Confirmation testing is testing fixes to a set of defects and Regression testing is testing to establish whether any defects have been introduced as a result of changes.' },
        { id: 'q28-b', label: 'B', text: 'Confirmation testing is testing to establish whether any defects have been introduced as a result of changes and Regression testing is testing fixes to a set of defects.' },
        { id: 'q28-c', label: 'C', text: 'Confirmation testing and Regression testing are both testing to establish whether any defects have been introduced as a result of changes.' },
        { id: 'q28-d', label: 'D', text: 'Confirmation testing and Regression testing are both testing fixes to a set of defects.' },
      ]
    },
    {
      id: 'q29',
      order: 29,
      prompt: 'Tool which stores requirement statements, check for consistency and allow requirements to be prioritized and enable individual tests to be traceable to requirements, functions and features.',
      correctOptionId: 'q29-b',
      options: [
        { id: 'q29-a', label: 'A', text: 'Incident management tools' },
        { id: 'q29-b', label: 'B', text: 'Requirements management tools' },
        { id: 'q29-c', label: 'C', text: 'Configuration management tools' },
        { id: 'q29-d', label: 'D', text: 'None of the others' },
      ]
    },
    {
      id: 'q30',
      order: 30,
      prompt: 'Some tools are geared more for developer use. For the 5 tools listed, which statement BEST details those for developers.\ni) Performance testing tools.\nii) Coverage measurement tools\niii) Test comparators.\niv) Dynamic analysis tools.\nv) Incident management tools.',
      correctOptionId: 'q30-b',
      options: [
        { id: 'q30-a', label: 'A', text: 'i, iii. and iv. are more for developers.' },
        { id: 'q30-b', label: 'B', text: 'ii. and iv. are more for developers.' },
        { id: 'q30-c', label: 'C', text: 'ii, iii. and iv. are more for developers.' },
        { id: 'q30-d', label: 'D', text: 'ii. and iii. are more for developers.' },
      ]
    },
    {
      id: 'q31',
      order: 31,
      prompt: 'One of the fields on a form contains a text box which accepts alpha numeric values. Identify the Valid Equivalence class',
      correctOptionId: 'q31-c',
      options: [
        { id: 'q31-a', label: 'A', text: 'BOOK' },
        { id: 'q31-b', label: 'B', text: 'Book' },
        { id: 'q31-c', label: 'C', text: 'Boo01k' },
        { id: 'q31-d', label: 'D', text: 'book' },
      ]
    },
    {
      id: 'q32',
      order: 32,
      prompt: 'Integration testing in the large involves:',
      correctOptionId: 'q32-a',
      options: [
        { id: 'q32-a', label: 'A', text: 'Testing the system when combined with other systems.' },
        { id: 'q32-b', label: 'B', text: 'Testing a sub-system using stubs and drivers' },
        { id: 'q32-c', label: 'C', text: 'Testing a system with a large number of users' },
        { id: 'q32-d', label: 'D', text: 'Combing software components and testing them in one go.' },
      ]
    },
    {
      id: 'q33',
      order: 33,
      prompt: 'Capture and replay facilities are least likely to be used to _____',
      correctOptionId: 'q33-d',
      options: [
        { id: 'q33-a', label: 'A', text: 'Performance testing' },
        { id: 'q33-b', label: 'B', text: 'Recovery testing' },
        { id: 'q33-c', label: 'C', text: 'GUI testing' },
        { id: 'q33-d', label: 'D', text: 'User requirements.' },
      ]
    },
    {
      id: 'q34',
      order: 34,
      prompt: 'Which of the following is a static test?',
      correctOptionId: 'q34-a',
      options: [
        { id: 'q34-a', label: 'A', text: 'Code inspection' },
        { id: 'q34-b', label: 'B', text: 'Coverage analysis' },
        { id: 'q34-c', label: 'C', text: 'Usability assessment' },
        { id: 'q34-d', label: 'D', text: 'Installation test' },
      ]
    },
    {
      id: 'q35',
      order: 35,
      prompt: 'Unreachable code would best be found using:',
      correctOptionId: 'q35-d',
      options: [
        { id: 'q35-a', label: 'A', text: 'Code reviews' },
        { id: 'q35-b', label: 'B', text: 'Code inspections' },
        { id: 'q35-c', label: 'C', text: 'A coverage tool' },
        { id: 'q35-d', label: 'D', text: 'A static analysis tool' },
      ]
    },
    {
      id: 'q36',
      order: 36,
      prompt: 'The purpose of exit criteria is: (choose one answer)',
      correctOptionId: 'q36-a',
      options: [
        { id: 'q36-a', label: 'A', text: 'Define when to stop testing' },
        { id: 'q36-b', label: 'B', text: 'End of test level' },
        { id: 'q36-c', label: 'C', text: 'When a set of tests has achieved a specific pre condition' },
        { id: 'q36-d', label: 'D', text: 'All of the others' },
      ]
    },
    {
      id: 'q37',
      order: 37,
      prompt: 'Failure is ___________',
      correctOptionId: 'q37-a',
      options: [
        { id: 'q37-a', label: 'A', text: 'Incorrect program behaviour due to a fault in the program' },
        { id: 'q37-b', label: 'B', text: 'Bug found before product Release' },
        { id: 'q37-c', label: 'C', text: 'Bug found after product Release' },
        { id: 'q37-d', label: 'D', text: 'Bug found during Design phase' },
      ]
    },
    {
      id: 'q38',
      order: 38,
      prompt: 'Reviewing the test Basis is a part of which phase',
      correctOptionId: 'q38-a',
      options: [
        { id: 'q38-a', label: 'A', text: 'Test Analysis and Design' },
        { id: 'q38-b', label: 'B', text: 'Test Implementation and execution' },
        { id: 'q38-c', label: 'C', text: 'Test Closure Activities' },
        { id: 'q38-d', label: 'D', text: 'Evaluating exit criteria and reporting' },
      ]
    },
    {
      id: 'q39',
      order: 39,
      prompt: 'A tool that supports traceability, recording of incidents or scheduling of tests is called:',
      correctOptionId: 'q39-d',
      options: [
        { id: 'q39-a', label: 'A', text: 'A dynamic analysis tool' },
        { id: 'q39-b', label: 'B', text: 'A test execution tool' },
        { id: 'q39-c', label: 'C', text: 'A debugging tool' },
        { id: 'q39-d', label: 'D', text: 'A test management tool' },
      ]
    },
    {
      id: 'q40',
      order: 40,
      prompt: 'Which is not a testing principle',
      correctOptionId: 'q40-d',
      options: [
        { id: 'q40-a', label: 'A', text: 'Early testing' },
        { id: 'q40-b', label: 'B', text: 'Defect clustering' },
        { id: 'q40-c', label: 'C', text: 'Pesticide paradox' },
        { id: 'q40-d', label: 'D', text: 'Exhaustive testing' },
      ]
    },
    {
      id: 'q41',
      order: 41,
      prompt: 'The place to start if you want a (new) test tool is:',
      correctOptionId: 'q41-c',
      options: [
        { id: 'q41-a', label: 'A', text: 'Attend a tool exhibition' },
        { id: 'q41-b', label: 'B', text: 'Invite a vendor to give a demo' },
        { id: 'q41-c', label: 'C', text: 'Analyze your needs and requirements' },
        { id: 'q41-d', label: 'D', text: 'Find out what your budget would be for the tool' },
      ]
    },
    {
      id: 'q42',
      order: 42,
      prompt: 'Which of the following is a Key Characteristics of WalkThrough',
      correctOptionId: 'q42-a',
      options: [
        { id: 'q42-a', label: 'A', text: 'Scenario , Dry Run , Peer Group' },
        { id: 'q42-b', label: 'B', text: 'Pre Meeting Preparations' },
        { id: 'q42-c', label: 'C', text: 'Formal Follow Up Process' },
        { id: 'q42-d', label: 'D', text: 'Includes Metrics' },
      ]
    },
    {
      id: 'q43',
      order: 43,
      prompt: 'How much percentage of the life cycle costs of a software are spent on maintenance.',
      correctOptionId: 'q43-d',
      options: [
        { id: 'q43-a', label: 'A', text: '10%' },
        { id: 'q43-b', label: 'B', text: '30%' },
        { id: 'q43-c', label: 'C', text: '50%' },
        { id: 'q43-d', label: 'D', text: '70%' },
      ]
    },
    {
      id: 'q44',
      order: 44,
      prompt: 'Who are the persons involved in a Formal Review\ni) Manager\nii) Moderator\niii) Scribe / Recorder\niv) Assistant Manager',
      correctOptionId: 'q44-b',
      options: [
        { id: 'q44-a', label: 'A', text: 'i,ii,iii,iv are true' },
        { id: 'q44-b', label: 'B', text: 'i,ii,iii are true and iv is false' },
        { id: 'q44-c', label: 'C', text: 'ii,iii,iv are true and i is false' },
        { id: 'q44-d', label: 'D', text: 'i,iv are true and ii, iii are false' },
      ]
    },
    {
      id: 'q45',
      order: 45,
      prompt: 'Which of the following statements is true of static analysis:',
      correctOptionId: 'q45-c',
      options: [
        { id: 'q45-a', label: 'A', text: 'Compiling code is not a form of static analysis' },
        { id: 'q45-b', label: 'B', text: 'Static analysis need not be performed before imperative code is executed' },
        { id: 'q45-c', label: 'C', text: 'Static analysis can find faults that are hard to find with dynamic testing.' },
        { id: 'q45-d', label: 'D', text: 'Extensive statistical analysis will not be needed if white- Box testing is to be performed.' },
      ]
    },
    {
      id: 'q46',
      order: 46,
      prompt: 'The Planning phase of a formal review includes which of the followings?',
      correctOptionId: 'q46-b',
      options: [
        { id: 'q46-a', label: 'A', text: 'Explaining the objectives' },
        { id: 'q46-b', label: 'B', text: 'Selecting the personnel, allocating roles' },
        { id: 'q46-c', label: 'C', text: 'Follow up' },
        { id: 'q46-d', label: 'D', text: 'Individual Meeting preparations' },
      ]
    },
    {
      id: 'q47',
      order: 47,
      prompt: 'As part of which test process do you determine the exit criteria?',
      correctOptionId: 'q47-a',
      options: [
        { id: 'q47-a', label: 'A', text: 'Test planning' },
        { id: 'q47-b', label: 'B', text: 'Evaluating exit criteria and reporting' },
        { id: 'q47-c', label: 'C', text: 'Test closure' },
        { id: 'q47-d', label: 'D', text: 'Test control' },
      ]
    },
    {
      id: 'q48',
      order: 48,
      prompt: 'Which of the following is NOT part of configuration management:',
      correctOptionId: 'q48-b',
      options: [
        { id: 'q48-a', label: 'A', text: 'Status accounting of configuration items' },
        { id: 'q48-b', label: 'B', text: 'Auditing conformance to ISO9001' },
        { id: 'q48-c', label: 'C', text: 'Identification of test versions' },
        { id: 'q48-d', label: 'D', text: 'Record of changes to documentation over time' },
      ]
    },
    {
      id: 'q49',
      order: 49,
      prompt: 'In case of Large Systems :',
      correctOptionId: 'q49-b',
      options: [
        { id: 'q49-a', label: 'A', text: 'Only few tests should be run' },
        { id: 'q49-b', label: 'B', text: 'Testing should be on the basis of Risk' },
        { id: 'q49-c', label: 'C', text: 'Only Good Test Cases should be executed' },
        { id: 'q49-d', label: 'D', text: 'Test Cases written by good test engineers should be executed' },
      ]
    },
    {
      id: 'q50',
      order: 50,
      prompt: 'Which of the following is not a type of incremental testing approach?',
      correctOptionId: 'q50-b',
      options: [
        { id: 'q50-a', label: 'A', text: 'Top down' },
        { id: 'q50-b', label: 'B', text: 'Big-bang' },
        { id: 'q50-c', label: 'C', text: 'Bottom up' },
        { id: 'q50-d', label: 'D', text: 'Functional incrementation' },
      ]
    },
    {
      id: 'q51',
      order: 51,
      prompt: 'In which order should tests be run?',
      correctOptionId: 'q51-a',
      options: [
        { id: 'q51-a', label: 'A', text: 'The most important tests first' },
        { id: 'q51-b', label: 'B', text: 'The most difficult tests first(to allow maximum time for fixing)' },
        { id: 'q51-c', label: 'C', text: 'The easiest tests first (to give initial confidence)' },
        { id: 'q51-d', label: 'D', text: 'The order they are thought of' },
      ]
    },
    {
      id: 'q52',
      order: 52,
      prompt: 'Which rule should not be followed for reviews',
      correctOptionId: 'q52-a',
      options: [
        { id: 'q52-a', label: 'A', text: 'Defects and issues are identified and corrected' },
        { id: 'q52-b', label: 'B', text: 'The product is reviewed not the producer' },
        { id: 'q52-c', label: 'C', text: 'All members of the reviewing team are responsible for the result of the review' },
        { id: 'q52-d', label: 'D', text: 'Each review has a clear predefined objective' },
      ]
    },
    {
      id: 'q53',
      order: 53,
      prompt: 'A formal assessment of a work product conducted by one or more qualified independent reviewer to detect defects.',
      correctOptionId: 'q53-a',
      options: [
        { id: 'q53-a', label: 'A', text: 'Inspection' },
        { id: 'q53-b', label: 'B', text: 'Walkthrough' },
        { id: 'q53-c', label: 'C', text: 'Review' },
        { id: 'q53-d', label: 'D', text: 'Non Conformance' },
      ]
    },
    {
      id: 'q54',
      order: 54,
      prompt: 'Which of the following is a MAJOR task of test planning?',
      correctOptionId: 'q54-a',
      options: [
        { id: 'q54-a', label: 'A', text: 'Scheduling test analysis and design tasks.' },
        { id: 'q54-b', label: 'B', text: 'Initiating corrective actions.' },
        { id: 'q54-c', label: 'C', text: 'Monitoring progress and test coverage.' },
        { id: 'q54-d', label: 'D', text: 'Measuring and analyzing results.' },
      ]
    },
    {
      id: 'q55',
      order: 55,
      prompt: 'The ___________ testing is performed at the developing organization\'s site',
      correctOptionId: 'q55-c',
      options: [
        { id: 'q55-a', label: 'A', text: 'Unit testing' },
        { id: 'q55-b', label: 'B', text: 'Regression testing' },
        { id: 'q55-c', label: 'C', text: 'Alpha testing' },
        { id: 'q55-d', label: 'D', text: 'Integration testing' },
      ]
    },
    {
      id: 'q56',
      order: 56,
      prompt: 'Defects discovered by static analysis tools include:\ni. Variables that are never used.\nii. Security vulnerabilities.\niii. Programming Standard Violations.\niv. Uncalled functions and procedures',
      correctOptionId: 'q56-a',
      options: [
        { id: 'q56-a', label: 'A', text: 'i, ii,iii,iv is correct' },
        { id: 'q56-b', label: 'B', text: 'iii ,is correct I,ii,iv are incorrect' },
        { id: 'q56-c', label: 'C', text: 'i ,ii, iii and iv are incorrect' },
        { id: 'q56-d', label: 'D', text: 'iv, ii is correct' },
      ]
    },
    {
      id: 'q57',
      order: 57,
      prompt: 'When a new testing tool is purchased, it should be used first by:',
      correctOptionId: 'q57-a',
      options: [
        { id: 'q57-a', label: 'A', text: 'A small team to establish the best way to use the tool' },
        { id: 'q57-b', label: 'B', text: 'Everyone who may eventually have some use for the tool' },
        { id: 'q57-c', label: 'C', text: 'The independent testing team' },
        { id: 'q57-d', label: 'D', text: 'The vendor contractor to write the initial scripts' },
      ]
    },
    {
      id: 'q58',
      order: 58,
      prompt: 'How much testing is enough?',
      correctOptionId: 'q58-c',
      options: [
        { id: 'q58-a', label: 'A', text: 'This question is impossible to answer' },
        { id: 'q58-b', label: 'B', text: 'This question is easy to answer' },
        { id: 'q58-c', label: 'C', text: 'The answer depends on the risk for your industry, contract and special requirements' },
        { id: 'q58-d', label: 'D', text: 'This answer depends on the maturity of your developers' },
      ]
    },
    {
      id: 'q59',
      order: 59,
      prompt: 'The vendor contractor to write the initial scripts',
      correctOptionId: 'q59-c',
      options: [
        { id: 'q59-a', label: 'A', text: 'Measuring response time' },
        { id: 'q59-b', label: 'B', text: 'Measuring transaction rates' },
        { id: 'q59-c', label: 'C', text: 'Recovery testing' },
        { id: 'q59-d', label: 'D', text: 'Simulating many users' },
      ]
    }
  ]
};

export const getQuizzes = async (userId?: string | null): Promise<Quiz[]> => {
  try {
    // Try to fetch from API first
    const quizzes = await api.apiGetQuizzes(userId);
    if (quizzes && quizzes.length > 0) {
      return quizzes as Quiz[];
    }
    
    // Fallback to localStorage if API fails
    const data = localStorage.getItem(STORAGE_KEY);
    let localQuizzes: Quiz[] = [];
    
    if (!data) {
      const initialQuizzes = [DEMO_QUIZ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialQuizzes));
      localQuizzes = initialQuizzes;
    } else {
      localQuizzes = JSON.parse(data);
      const demoIndex = localQuizzes.findIndex(q => q.id === DEMO_QUIZ.id);
      if (demoIndex !== -1 && localQuizzes[demoIndex].questions.length < DEMO_QUIZ.questions.length) {
         localQuizzes[demoIndex] = DEMO_QUIZ;
         localStorage.setItem(STORAGE_KEY, JSON.stringify(localQuizzes));
      }
    }
    
    if (userId) {
      return localQuizzes.filter(q => q.userId === userId || q.userId === 'demo');
    }
    
    return localQuizzes.filter(q => q.userId === 'demo');
  } catch (e) {
    console.error("Failed to load quizzes", e);
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [DEMO_QUIZ];
      const quizzes: Quiz[] = JSON.parse(data);
      if (userId) {
        return quizzes.filter(q => q.userId === userId || q.userId === 'demo');
      }
      return quizzes.filter(q => q.userId === 'demo');
    } catch (err) {
      return [];
    }
  }
};

export const saveQuiz = async (quiz: Quiz, userId: string): Promise<void> => {
  try {
    // Try to save to API first
    await api.apiSaveQuiz(quiz, userId);
    
    // Also save to localStorage as backup
    const data = localStorage.getItem(STORAGE_KEY);
    let allQuizzes: Quiz[] = data ? JSON.parse(data) : [];
    const quizWithUserId = { ...quiz, userId };
    const existingIndex = allQuizzes.findIndex(q => q.id === quizWithUserId.id);
    
    if (existingIndex >= 0) {
      const existingQuiz = allQuizzes[existingIndex];
      if (existingQuiz.userId === userId || existingQuiz.userId === 'demo') {
        allQuizzes[existingIndex] = quizWithUserId;
      }
    } else {
      allQuizzes.push(quizWithUserId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuizzes));
  } catch (error) {
    console.error("Failed to save quiz to API, using localStorage", error);
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    let allQuizzes: Quiz[] = data ? JSON.parse(data) : [];
    const quizWithUserId = { ...quiz, userId };
    const existingIndex = allQuizzes.findIndex(q => q.id === quizWithUserId.id);
    
    if (existingIndex >= 0) {
      const existingQuiz = allQuizzes[existingIndex];
      if (existingQuiz.userId === userId || existingQuiz.userId === 'demo') {
        allQuizzes[existingIndex] = quizWithUserId;
      }
    } else {
      allQuizzes.push(quizWithUserId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuizzes));
  }
};

export const deleteQuiz = async (id: string, userId: string): Promise<void> => {
  try {
    // Try to delete from API first
    await api.apiDeleteQuiz(id, userId);
    
    // Also delete from localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const allQuizzes: Quiz[] = JSON.parse(data);
    const quizToDelete = allQuizzes.find(q => q.id === id);
    
    if (quizToDelete && quizToDelete.userId === userId && quizToDelete.userId !== 'demo') {
      const filtered = allQuizzes.filter(q => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Failed to delete quiz from API, using localStorage", error);
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const allQuizzes: Quiz[] = JSON.parse(data);
    const quizToDelete = allQuizzes.find(q => q.id === id);
    
    if (quizToDelete && quizToDelete.userId === userId && quizToDelete.userId !== 'demo') {
      const filtered = allQuizzes.filter(q => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- Attempt / Score History Methods ---

export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  try {
    // Try to fetch from API first
    const attempts = await api.apiGetQuizAttempts(quizId);
    if (attempts) {
      return attempts as QuizAttempt[];
    }
  } catch (error) {
    console.error("Failed to fetch attempts from API", error);
  }
  
  // Fallback to localStorage
  try {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    if (!data) return [];
    const allAttempts: QuizAttempt[] = JSON.parse(data);
    return allAttempts.filter(a => a.quizId === quizId);
  } catch (e) {
    console.error("Failed to load attempts", e);
    return [];
  }
};

export const saveAttempt = async (attempt: QuizAttempt): Promise<void> => {
  try {
    // Try to save to API first
    await api.apiSaveAttempt(attempt);
    
    // Also save to localStorage as backup
    const data = localStorage.getItem(ATTEMPTS_KEY);
    const allAttempts: QuizAttempt[] = data ? JSON.parse(data) : [];
    allAttempts.push(attempt);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(allAttempts));
  } catch (error) {
    console.error("Failed to save attempt to API, using localStorage", error);
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(ATTEMPTS_KEY);
      const allAttempts: QuizAttempt[] = data ? JSON.parse(data) : [];
      allAttempts.push(attempt);
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(allAttempts));
    } catch (e) {
      console.error("Failed to save attempt", e);
    }
  }
};

// --- Gemini API Key Management ---

export const getGeminiApiKey = (): string | null => {
  try {
    // Prefer user-saved key, fallback to preset default so users can skip input
    const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    return storedKey || DEFAULT_GEMINI_API_KEY;
  } catch (e) {
    console.error("Failed to get Gemini API key", e);
    return DEFAULT_GEMINI_API_KEY;
  }
};

export const saveGeminiApiKey = (apiKey: string): void => {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
  } catch (e) {
    console.error("Failed to save Gemini API key", e);
  }
};

export const clearGeminiApiKey = (): void => {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } catch (e) {
    console.error("Failed to clear Gemini API key", e);
  }
};

// --- Shared Quizzes Management ---

export const getSharedQuizIds = (): string[] => {
  try {
    const data = localStorage.getItem(SHARED_QUIZZES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to get shared quiz IDs", e);
    return [];
  }
};

export const addSharedQuizId = (quizId: string): void => {
  try {
    const sharedIds = getSharedQuizIds();
    if (!sharedIds.includes(quizId)) {
      sharedIds.push(quizId);
      localStorage.setItem(SHARED_QUIZZES_KEY, JSON.stringify(sharedIds));
      console.log('[addSharedQuizId] Added quiz ID:', quizId, 'Total shared:', sharedIds.length);
    } else {
      console.log('[addSharedQuizId] Quiz ID already exists:', quizId);
    }
  } catch (e) {
    console.error("[addSharedQuizId] Failed to add shared quiz ID", e);
  }
};

export const getSharedQuizzes = async (currentUserId?: string | null): Promise<Quiz[]> => {
  try {
    const sharedIds = getSharedQuizIds();
    console.log('[getSharedQuizzes] Shared IDs:', sharedIds, 'Current user:', currentUserId);
    if (sharedIds.length === 0) {
      console.log('[getSharedQuizzes] No shared quiz IDs found');
      return [];
    }
    
    // Fetch each shared quiz from API
    const quizzes: Quiz[] = [];
    for (const id of sharedIds) {
      try {
        console.log(`[getSharedQuizzes] Loading quiz ${id}...`);
        const quiz = await api.apiGetQuiz(id, currentUserId || null);
        console.log(`[getSharedQuizzes] Loaded quiz ${id}:`, { 
          title: quiz?.title, 
          isPublic: quiz?.isPublic, 
          userId: quiz?.userId,
          currentUserId 
        });
        
        // Only include if quiz is public and not owned by current user
        if (quiz && quiz.isPublic) {
          // Filter out if user owns this quiz
          if (!currentUserId || quiz.userId !== currentUserId) {
            quizzes.push(quiz as Quiz);
            console.log(`[getSharedQuizzes] Added quiz ${id} to shared list`);
          } else {
            console.log(`[getSharedQuizzes] Skipping quiz ${id} - user owns it`);
          }
        } else {
          console.log(`[getSharedQuizzes] Quiz ${id} is not public, skipping`);
        }
      } catch (error: any) {
        console.error(`[getSharedQuizzes] Failed to load shared quiz ${id}:`, error);
        // Don't remove - might be temporary error
        // Only remove if it's a 404 (quiz deleted)
        if (error?.message?.includes('not found') || error?.message?.includes('Quiz not found')) {
          console.log(`[getSharedQuizzes] Removing invalid quiz ID: ${id}`);
          const updatedIds = sharedIds.filter((sid: string) => sid !== id);
          localStorage.setItem(SHARED_QUIZZES_KEY, JSON.stringify(updatedIds));
        }
      }
    }
    
    console.log(`[getSharedQuizzes] Returning ${quizzes.length} shared quizzes`);
    return quizzes;
  } catch (e) {
    console.error("[getSharedQuizzes] Failed to get shared quizzes", e);
    return [];
  }
};