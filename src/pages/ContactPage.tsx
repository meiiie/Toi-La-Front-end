import { useNavigate } from 'react-router-dom';
import { useForm, FieldError } from 'react-hook-form';
import { ValidationError } from './ValidationError';

type Contact = {
  name: string;
  age: string;
  driver: string;
  email: string;
  reason: string;
  notes: string;
};

export function ContactPage() {
  const fieldStyle = 'flex flex-col mb-2';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Contact>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
  const navigate = useNavigate();

  function onSubmit(contact: Contact) {
    console.log('Submitted details:', contact);
    navigate(`/thank-you/${contact.name}`);
  }

  function getEditorStyle(fieldError: FieldError | undefined) {
    return fieldError ? 'border-red-500' : '';
  }

  return (
    <div className="flex flex-col py-10 max-w-md mx-auto">
      <h2 className="text-3xl font-bold underline mb-3">Contact Us</h2>
      <p className="mb-3">If you enter your details we'll get back to you as you as we can.</p>

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={fieldStyle}>
          <label htmlFor="name">Your name (*)</label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'You must enter your name' })}
            className={getEditorStyle(errors.name)}
          />
          <ValidationError fieldError={errors.name} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="age">How old are you?</label>
          <input
            type="number"
            step="1"
            id="age"
            {...register('age', {
              required: 'You must nhap tuoi',
              min: {
                value: 18,
                message: 'You must be at least 18 years old',
              },
              max: {
                value: 120,
                message: 'you must be at most 120 years old',
              },
            })}
            className={getEditorStyle(errors.name)}
          />
          <ValidationError fieldError={errors.age} />
        </div>

        <div className={fieldStyle}>
          <fieldset>
            <legend>
              Do you have a driver's license?<span aria-label="required">*</span>
            </legend>
            <input
              type="radio"
              id="r1"
              value="yes"
              {...register('driver', { required: 'You must select an option' })}
              className={getEditorStyle(errors.name)}
            />
            <label htmlFor="r1" className="mr-3.5">
              Yes
            </label>
            <input
              type="radio"
              id="r2"
              value="no"
              {...register('driver', { required: 'You must select an option' })}
              className={getEditorStyle(errors.name)}
            />
            <label htmlFor="r2">No</label>
            <ValidationError fieldError={errors.driver} />
          </fieldset>
        </div>

        <div className={fieldStyle}>
          <label htmlFor="email">Your email address (*)</label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'You must enter your email address',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Entered value does not match email format',
              },
            })}
            className={getEditorStyle(errors.name)}
          />
          <ValidationError fieldError={errors.email} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="reason">Reason you need to contact us (*)</label>
          <select
            id="reason"
            {...register('reason', {
              required: 'You must select a reason',
            })}
            className={getEditorStyle(errors.name)}
          >
            <option value="" hidden></option>
            <option value="Support">Support</option>
            <option value="Feedback">Feedback</option>
            <option value="Other">Other</option>
          </select>
          <ValidationError fieldError={errors.reason} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="notes">Additional notes</label>
          <textarea id="notes" {...register('notes')} />
        </div>

        <div>
          <button type="submit" className="mt-2 h-10 px-6 font-semibold bg-black text-white">
            SubMit
          </button>
        </div>
      </form>
    </div>
  );
}
